import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Info } from 'lucide-react';

interface CharitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (percentage: number) => void;
  charityName: string;
  isLoading: boolean;
}

const CharitySelectionModal: React.FC<CharitySelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  charityName,
  isLoading
}) => {
  const [percentage, setPercentage] = useState<number>(10);
  const [inputValue, setInputValue] = useState<string>('10');
  const [error, setError] = useState<string>('');

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    const numValue = parseFloat(value);
    
    if (value === '' || isNaN(numValue)) {
      setError('');
      return;
    }

    if (numValue < 10) {
      setError('Minimum 10% required');
      setPercentage(numValue);
    } else if (numValue > 100) {
      setError('Maximum 100%');
      setPercentage(100);
      setInputValue('100');
    } else {
      setError('');
      setPercentage(numValue);
    }
  };

  const handleSliderChange = (value: string) => {
    const numValue = parseFloat(value);
    setPercentage(numValue);
    setInputValue(value);
    setError('');
  };

  const handleConfirm = () => {
    if (percentage < 10) {
      setError('Minimum 10% required');
      return;
    }
    onConfirm(percentage);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                    <Heart size={28} className="text-emerald-400" fill="currentColor" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white heading-fancy">Set Your Impact</h2>
                    <p className="text-slate-500 text-sm font-medium">Choose contribution percentage</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Charity Name */}
              <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Selected Charity</p>
                <p className="text-xl font-black text-white">{charityName}</p>
              </div>

              {/* Percentage Input */}
              <div className="mb-6">
                <label className="block text-sm font-black text-white uppercase tracking-widest mb-4">
                  Contribution Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    step="1"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-8 py-6 bg-white/5 border rounded-2xl text-white text-3xl font-black text-center focus:bg-white/10 outline-none transition-all disabled:opacity-50 ${
                      error ? 'border-rose-500/50 focus:border-rose-500' : 'border-white/10 focus:border-emerald-500/50'
                    }`}
                  />
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-500">%</span>
                </div>
                
                {error && (
                  <p className="mt-3 text-rose-400 text-sm font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                    {error}
                  </p>
                )}
              </div>

              {/* Range Slider */}
              <div className="mb-8">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="1"
                  value={percentage}
                  onChange={(e) => handleSliderChange(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer disabled:opacity-50 slider"
                />
                <style>{`
                  .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: rgb(16 185 129);
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
                  }
                  .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: rgb(16 185 129);
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
                  }
                  .slider::-webkit-slider-runnable-track {
                    height: 8px;
                    border-radius: 4px;
                    background: linear-gradient(to right, 
                      rgb(16 185 129) 0%, 
                      rgb(16 185 129) ${percentage}%, 
                      rgba(255,255,255,0.1) ${percentage}%, 
                      rgba(255,255,255,0.1) 100%);
                  }
                  .slider::-moz-range-track {
                    height: 8px;
                    border-radius: 4px;
                    background: rgba(255,255,255,0.1);
                  }
                  .slider::-moz-range-progress {
                    height: 8px;
                    border-radius: 4px;
                    background: rgb(16 185 129);
                  }
                `}</style>
              </div>

              {/* Info Box */}
              <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-4">
                <Info size={20} className="text-blue-400 flex-shrink-0 mt-1" />
                <div className="text-sm text-slate-400 font-medium leading-relaxed">
                  <p className="mb-2">
                    <span className="text-white font-black">{percentage}%</span> of your subscription will go to {charityName}.
                  </p>
                  <p>
                    The remaining <span className="text-white font-black">{100 - percentage}%</span> will be divided into monthly prize pools.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading || percentage < 10}
                  className="flex-1 py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" />
                  ) : (
                    'Confirm Selection'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CharitySelectionModal;
