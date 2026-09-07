'use client';

import React from 'react';
import { CardEffect } from '@/app/types';
import PortalEffect from './PortalEffect';
import GlitchEffect from './GlitchEffect';
import LanternEffect from './LanternEffect';
import RippleEffect from './RippleEffect';
import BlackHoleEffect from './BlackHoleEffect';
// import PrintEffect from './PrintEffect';
import DispenserEffect from './DispenserEffect';
import OvergrownEffect from './OvergrownEffect';
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
    case 'glitch':
      return <GlitchEffect host={host} />;
    case 'lantern-reveal':
      return <LanternEffect host={host} />;
    case 'ripple':
      return <RippleEffect host={host} />;
    case 'black-hole':
      return <BlackHoleEffect host={host} />;
    // case 'print':
    //   return <PrintEffect host={host} />;
    case 'take-one':
      return <DispenserEffect host={host} />;
    case 'overgrown':
      return <OvergrownEffect host={host} />;
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
