'use client';

import React from 'react';
import { CardEffect } from '@/app/types';
import PortalEffect from './PortalEffect';
import HoloEffect from './HoloEffect';
import StardustEffect from './StardustEffect';
import ScrambleEffect from './ScrambleEffect';
import RepelEffect from './RepelEffect';
import ShatterEffect from './ShatterEffect';

interface CardEffectLayerProps {
  effect?: CardEffect | string;
  host: React.RefObject<HTMLDivElement | null>;
}

/**
 * Mounts the interaction/motion layer for a card. Unknown or missing values
 * render nothing, so an effect shipped on web before mobile knows about it
 * (or vice versa) degrades to a plain card.
 */
const CardEffectLayer: React.FC<CardEffectLayerProps> = ({ effect, host }) => {
  switch (effect) {
    case 'portal':
      return <PortalEffect host={host} dimension="space" />;
    case 'portal-grid':
      return <PortalEffect host={host} dimension="grid" />;
    case 'holo':
      return <HoloEffect host={host} />;
    case 'stardust':
      return <StardustEffect host={host} />;
    case 'scramble':
      return <ScrambleEffect host={host} />;
    case 'repel':
      return <RepelEffect host={host} />;
    case 'shatter':
      return <ShatterEffect host={host} />;
    default:
      return null;
  }
};

export default CardEffectLayer;
