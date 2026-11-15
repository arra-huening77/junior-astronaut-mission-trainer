import { useEffect, useRef, useState } from 'react';
import { Commander } from './Commander';
import { Hotspot } from './Hotspot';
import { Overlay } from './Overlay';
import {
  OUTPOST_BUILDINGS,
  OUTPOST_ROCKS,
  rockSrc,
  scaledWidth,
  type BuildingSlot,
  type RockSlot,
} from './outpostLayout';
import type { SceneLayerFlags, SpotId, SpotLayout, UiSettings } from './types';

const SKY_FADE_MS = 1250;
const FADE_TICK_MS = 32;

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

type SceneStageProps = {
  layers: SceneLayerFlags;
  spots: Record<SpotId, SpotLayout>;
  activeSpot?: SpotId | null;
  hotspotsEnabled?: boolean;
  commander: {
    x: number;
    y: number;
    pose?: 'idle' | 'walk' | 'cheer' | 'concerned';
  };
  moodTintClassName?: string;
  settings: UiSettings;
  onSelectSpot: (id: SpotId) => void;
  onCommanderArrived?: () => void;
  onSkipWalk?: () => void;
  showSkipWalk?: boolean;
  /** Optional sky override; otherwise uses `bg/sky_*` for weather/time. */
  backdropSrc?: string;
  showBuildings?: boolean;
  eventEffects?: readonly string[];
  cameraPan?: boolean;
};

/**
 * Landscape backdrops with a road + ground plane.
 * `sky_dawn.png` is atmosphere-only, so dawn reuses day terrain; mood tint supplies the glow.
 */
export const SKY_BACKDROPS: Record<SceneLayerFlags['sky'], string> = {
  day: '/assets/bg/sky_day.png',
  dawn: '/assets/bg/sky_day.png',
  dusk: '/assets/bg/sky_dusk.png',
  night: '/assets/bg/sky_night.png',
  dust: '/assets/bg/sky_dust.png',
};

const SOLAR: Record<SceneLayerFlags['solar'], string> = {
  clean: '/assets/buildings/solar_panels_clean.png',
  dusty: '/assets/buildings/solar_panels_dusty.png',
  covered: '/assets/buildings/solar_panels_covered.png',
  damaged: '/assets/buildings/solar_panels_damaged.png',
};

function BuildingSprite({
  src,
  slot,
  className = '',
}: {
  src: string;
  slot: BuildingSlot;
  className?: string;
}) {
  const width = scaledWidth(slot.baseWidth, slot.bottom);
  return (
    <img
      className={`ui-scene__prop ${className}`.trim()}
      data-building={slot.id}
      src={src}
      alt=""
      draggable={false}
      style={{
        left: `${slot.x}%`,
        bottom: `${slot.bottom}%`,
        width: `${width}%`,
        zIndex: slot.z,
      }}
    />
  );
}

function RockSprite({ slot }: { slot: RockSlot }) {
  const width = scaledWidth(slot.baseWidth, slot.bottom);
  return (
    <img
      className="ui-scene__prop ui-scene__prop--rock"
      src={rockSrc(slot.size)}
      alt=""
      draggable={false}
      style={{
        left: `${slot.x}%`,
        bottom: `${slot.bottom}%`,
        width: `${width}%`,
        zIndex: slot.z,
      }}
    />
  );
}

/** Keep the Sol 1 ground registration under every time/weather sky. */
function BackdropPlate({
  src,
  opacity = 1,
  fading = false,
}: {
  src: string;
  opacity?: number;
  fading?: boolean;
}) {
  const weather =
    src === SKY_BACKDROPS.night
      ? 'night'
      : src === SKY_BACKDROPS.dust
        ? 'dust'
        : src === SKY_BACKDROPS.dusk
          ? 'dusk'
          : null;

  return (
    <div
      className={`ui-scene__layer ui-scene__backdrop-plate ${fading ? 'ui-scene__backdrop--fade' : ''}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <img
        className="ui-scene__layer ui-scene__backdrop"
        src={src}
        alt=""
        draggable={false}
      />
      {weather ? (
        <img
          className={`ui-scene__layer ui-scene__backdrop ui-scene__terrain ui-scene__terrain--${weather}`}
          src={SKY_BACKDROPS.day}
          alt=""
          draggable={false}
        />
      ) : null}
    </div>
  );
}

/** Crossfades sky art when weather / event mood changes the backdrop. */
function SceneBackdrop({
  src,
  reduceMotion,
}: {
  src: string;
  reduceMotion: boolean;
}) {
  const [baseSrc, setBaseSrc] = useState(src);
  const [fadeSrc, setFadeSrc] = useState<string | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const baseRef = useRef(src);

  useEffect(() => {
    if (reduceMotion) {
      baseRef.current = src;
      setBaseSrc(src);
      setFadeSrc(null);
      setFadeOpacity(0);
      return;
    }

    if (src === baseRef.current) {
      setFadeSrc(null);
      setFadeOpacity(0);
      return;
    }

    setFadeSrc(src);
    setFadeOpacity(0);
    const start = performance.now();
    let timer = 0;

    const tick = () => {
      const t = smoothstep((performance.now() - start) / SKY_FADE_MS);
      setFadeOpacity(t);
      if (t >= 1) {
        baseRef.current = src;
        setBaseSrc(src);
        setFadeSrc(null);
        setFadeOpacity(0);
        return;
      }
      timer = window.setTimeout(tick, FADE_TICK_MS);
    };
    timer = window.setTimeout(tick, FADE_TICK_MS);

    return () => window.clearTimeout(timer);
  }, [src, reduceMotion]);

  return (
    <>
      <BackdropPlate src={baseSrc} />
      {fadeSrc && fadeSrc !== baseSrc ? (
        <BackdropPlate
          key={fadeSrc}
          src={fadeSrc}
          fading
          opacity={fadeOpacity}
        />
      ) : null}
    </>
  );
}

/** 16:9 outpost stage. Camera transforms should wrap this whole stage so hotspots stay aligned. */
export function SceneStage({
  layers,
  spots,
  activeSpot = null,
  hotspotsEnabled = false,
  commander,
  moodTintClassName,
  settings,
  onSelectSpot,
  onCommanderArrived,
  onSkipWalk,
  showSkipWalk = false,
  backdropSrc,
  showBuildings = true,
  eventEffects = [],
  cameraPan = false,
}: SceneStageProps) {
  const skySrc = backdropSrc ?? SKY_BACKDROPS[layers.sky];

  return (
    <div className="ui-scene">
      <div
        className={`ui-scene__stage ${cameraPan && !settings.reduceMotion ? 'mission-camera-pan' : ''}`}
        aria-label="Mars outpost"
      >
        <SceneBackdrop src={skySrc} reduceMotion={settings.reduceMotion} />

        {showBuildings ? (
          <div
            className="ui-scene__props"
            data-active-spot={hotspotsEnabled ? activeSpot : undefined}
            aria-hidden="true"
          >
            {OUTPOST_ROCKS.map((rock) => (
              <RockSprite key={rock.id} slot={rock} />
            ))}
            <BuildingSprite
              src="/assets/buildings/greenhouse.png"
              slot={OUTPOST_BUILDINGS.greenhouse}
            />
            <BuildingSprite
              src="/assets/buildings/shelter_closed.png"
              slot={OUTPOST_BUILDINGS.shelter}
              className={layers.shelterOpen ? 'is-hidden' : ''}
            />
            {layers.shelterOpen ? (
              <BuildingSprite
                src="/assets/buildings/shelter_open.png"
                slot={OUTPOST_BUILDINGS.shelter}
              />
            ) : null}
            <BuildingSprite
              src={SOLAR[layers.solar]}
              slot={OUTPOST_BUILDINGS.solar}
            />
            <BuildingSprite
              src={SOLAR[layers.solar]}
              slot={OUTPOST_BUILDINGS.solarB}
            />
            {layers.extraPanels ? (
              <BuildingSprite
                src="/assets/buildings/extra_panels.png"
                slot={OUTPOST_BUILDINGS.extraPanels}
              />
            ) : null}
            <BuildingSprite
              src="/assets/buildings/air_module.png"
              slot={OUTPOST_BUILDINGS.air}
            />
            <BuildingSprite
              src="/assets/buildings/habitat.png"
              slot={OUTPOST_BUILDINGS.habitat}
            />
            <BuildingSprite
              src="/assets/buildings/comms_dish.png"
              slot={OUTPOST_BUILDINGS.dish}
            />
            {layers.shieldPlating ? (
              <BuildingSprite
                src="/assets/buildings/shield_plating.png"
                slot={OUTPOST_BUILDINGS.shieldPlating}
              />
            ) : null}
            {layers.garageOpen ? (
              <BuildingSprite
                src="/assets/buildings/rover_garage_open.png"
                slot={OUTPOST_BUILDINGS.garage}
              />
            ) : null}
            <BuildingSprite
              src="/assets/buildings/outpost_rover.png"
              slot={OUTPOST_BUILDINGS.rover}
            />
            {layers.batteryBox ? (
              <BuildingSprite
                src="/assets/buildings/battery_box.png"
                slot={OUTPOST_BUILDINGS.batteryBox}
              />
            ) : null}
          </div>
        ) : null}

        <Overlay
          kind={layers.frost ? 'frost' : 'none'}
          tintClassName={moodTintClassName}
          reduceMotion={settings.reduceMotion}
        />

        <div
          className={`mission-effects ${!settings.reduceMotion ? 'mission-effects--moving' : ''}`}
          aria-hidden="true"
        >
          {eventEffects.some((c) => c.includes('puff')) && (
            <img
              className="mission-effects__hiss"
              src="/assets/overlays/hiss_puff.png"
              alt=""
            />
          )}
          {eventEffects.some((c) => c.includes('spark')) && (
            <img
              className="mission-effects__spark"
              src="/assets/overlays/spark.png"
              alt=""
            />
          )}
          {eventEffects.some(
            (c) => c.includes('meteor') || c.includes('shooting'),
          ) && <span className="mission-effects__meteor" />}
          {eventEffects.some((c) => c.includes('glow')) && (
            <span className="mission-effects__glow" />
          )}
          {eventEffects.some((c) => c.includes('supply_ship')) && (
            <img
              className="mission-effects__ship"
              src="/assets/buildings/supply_ship.png"
              alt=""
            />
          )}
        </div>
        {(Object.keys(spots) as SpotId[]).map((id) => (
          <Hotspot
            key={id}
            id={id}
            layout={spots[id]}
            active={activeSpot === id}
            enabled={hotspotsEnabled}
            reduceMotion={settings.reduceMotion}
            onSelect={onSelectSpot}
          />
        ))}

        <Commander
          x={commander.x}
          y={commander.y}
          pose={commander.pose}
          reduceMotion={settings.reduceMotion}
          onArrived={onCommanderArrived}
        />
      </div>

      {showSkipWalk && onSkipWalk ? (
        <button
          type="button"
          className="ui-btn ui-scene__skip"
          onClick={onSkipWalk}
        >
          Finish walk
        </button>
      ) : null}
    </div>
  );
}
