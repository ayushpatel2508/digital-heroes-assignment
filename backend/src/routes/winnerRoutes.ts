import { Router, Request, Response } from 'express';
import supabase from '../lib/supabase';
import multer, { FileFilterCallback } from 'multer';
import { decode } from 'base64-arraybuffer';

const router = Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

/**
 * GET /api/winners/user/:userId
 * Get all wins for a specific user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  console.log(`🏆 Fetching wins for user: ${userId}`);
  
  try {
    const { data, error } = await supabase
      .from('winners')
      .select(`
        *,
        monthly_draws (draw_month, winning_numbers)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Check if proof screenshots exist in storage
    const winnersWithProofStatus = await Promise.all((data || []).map(async (winner) => {
      let hasProof = false;
      let proofUrl = null;

      if (winner.proof_screenshot_url) {
        // Extract file path from URL
        const urlParts = winner.proof_screenshot_url.split('/winners-proof/');
        if (urlParts[1]) {
          const filePath = urlParts[1];
          
          // Check if file exists
          const { data: fileData, error: fileError } = await supabase.storage
            .from('winners-proof')
            .list(userId as string, {
              search: filePath.split('/')[1] // Get filename
            });

          if (!fileError && fileData && fileData.length > 0) {
            hasProof = true;
            
            // Generate signed URL for viewing
            const { data: signedData } = await supabase.storage
              .from('winners-proof')
              .createSignedUrl(filePath, 3600); // 1 hour expiry

            proofUrl = signedData?.signedUrl || winner.proof_screenshot_url;
          }
        }
      }

      return {
        ...winner,
        has_proof: hasProof,
        proof_url: proofUrl
      };
    }));

    console.log(`✅ Found ${winnersWithProofStatus.length} wins for user ${userId}`);
    res.json(winnersWithProofStatus);
  } catch (error: any) {
    console.error('❌ Error fetching user wins:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/winners/:winnerId/upload-proof
 * Upload proof screenshot for a win
 */
router.post('/:winnerId/upload-proof', (req: Request, res: Response, next: any) => {
  upload.single('proof')(req, res, (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File too large. Maximum size is 5MB.',
          code: 'FILE_TOO_LARGE'
        });
      }
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ 
          error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
          code: 'INVALID_FILE_TYPE'
        });
      }
      return res.status(400).json({ 
        error: err.message || 'File upload failed',
        code: 'UPLOAD_ERROR'
      });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  const { winnerId } = req.params;
  const file = req.file as Express.Multer.File | undefined;

  if (!file) {
    return res.status(400).json({ 
      error: 'No file uploaded. Please select an image.',
      code: 'NO_FILE'
    });
  }

  console.log(`📸 Uploading proof for winner: ${winnerId}`);

  try {
    // Get winner details
    const { data: winner, error: winnerError } = await supabase
      .from('winners')
      .select('user_id, proof_screenshot_url')
      .eq('id', winnerId)
      .single();

    if (winnerError || !winner) {
      return res.status(404).json({ 
        error: 'Winner not found',
        code: 'WINNER_NOT_FOUND'
      });
    }

    // Check if proof already uploaded
    if (winner.proof_screenshot_url) {
      return res.status(400).json({ 
        error: 'Proof already uploaded. You can only upload once.',
        code: 'ALREADY_UPLOADED'
      });
    }

    const userId = winner.user_id;
    const timestamp = Date.now();
    const fileExt = file.originalname.split('.').pop();
    const fileName = `proof-${winnerId}-${timestamp}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('winners-proof')
      .upload(filePath, decode(file.buffer.toString('base64')), {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      
      // Handle specific storage errors
      if (uploadError.message.includes('Bucket not found')) {
        return res.status(500).json({ 
          error: 'Storage not configured. Please contact support.',
          code: 'STORAGE_NOT_CONFIGURED'
        });
      }
      
      return res.status(500).json({ 
        error: uploadError.message || 'Failed to upload file',
        code: 'STORAGE_ERROR'
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('winners-proof')
      .getPublicUrl(filePath);

    const proofUrl = urlData.publicUrl;

    // Update winner record
    const { data: updatedWinner, error: updateError } = await supabase
      .from('winners')
      .update({ 
        proof_screenshot_url: proofUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', winnerId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`✅ Proof uploaded successfully for winner ${winnerId}`);
    res.json({ 
      message: 'Proof uploaded successfully',
      winner: updatedWinner,
      proofUrl
    });

  } catch (error: any) {
    console.error('❌ Error uploading proof:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/winners/:winnerId/proof
 * Get signed URL for viewing proof screenshot
 */
router.get('/:winnerId/proof', async (req: Request, res: Response) => {
  const { winnerId } = req.params;

  try {
    const { data: winner, error } = await supabase
      .from('winners')
      .select('user_id, proof_screenshot_url')
      .eq('id', winnerId)
      .single();

    if (error || !winner || !winner.proof_screenshot_url) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // Extract file path from URL
    const urlParts = winner.proof_screenshot_url.split('/winners-proof/');
    if (!urlParts[1]) {
      return res.status(404).json({ error: 'Invalid proof URL' });
    }

    const filePath = urlParts[1];

    // Generate signed URL
    const { data: signedData, error: signedError } = await supabase.storage
      .from('winners-proof')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedError) throw signedError;

    res.json({ 
      proofUrl: signedData.signedUrl,
      expiresIn: 3600
    });

  } catch (error: any) {
    console.error('❌ Error getting proof URL:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
