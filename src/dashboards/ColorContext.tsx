import { createContext, useContext } from 'react';

export type ColorMapping = Record<string, Record<string, string>>;

export const palette = [
  '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
  '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
  '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c',
  '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5'
];

export interface ColorContextType {
  getColor: (group: string, value: string) => string;
}

export const ColorContext = createContext<ColorContextType | null>(null);

export function useColor() {
  return useContext(ColorContext);
}
