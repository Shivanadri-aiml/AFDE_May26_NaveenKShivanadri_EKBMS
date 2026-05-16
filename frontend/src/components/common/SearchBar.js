import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  className = '',
  autoFocus = false
}) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit(e);
    }
  };

  const handleClear = () => {
    onChange({ target: { value: '' } });
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <FiSearch
        className="absolute left-3 text-gray-400"
        size={18}
      />
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
