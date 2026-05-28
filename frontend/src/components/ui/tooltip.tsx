import { useState, ReactNode } from 'react';

export function TooltipProvider({ children }: { children: ReactNode }) { return <>{children}</>; }

export function Tooltip({ children }: { children: ReactNode }) { return <>{children}</>; }

export function TooltipTrigger({ children, asChild }: any) { return <>{children}</>; }

export function TooltipContent({ children, className, style }: any) {
  return null; // simplified — actual tooltips need portal
}
