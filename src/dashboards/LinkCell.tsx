import React from 'react';

interface LinkCellProps {
  value: any;
}

export const LinkCell: React.FC<LinkCellProps> = ({ value }) => {
  const s = String(value);
  if (s.startsWith('http')) {
    const parts = s.split('|');
    if (parts.length === 2) {
      return <a href={parts[0]} target='_blank' rel='noopener noreferrer' className='text-blue-500 hover:underline'>{parts[1]}</a>;
    }
    return <a href={s} target='_blank' rel='noopener noreferrer' className='text-blue-500 hover:underline'>{s}</a>;
  }
  return <>{value ?? ''}</>;
};