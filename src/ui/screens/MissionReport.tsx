import { useEffect, useMemo, useState } from 'react';
import type { GameState } from '../../engine/types';
import type { DebriefResponse } from '../../engine/contracts';
import { debriefPayload, choiceDrains } from '../../engine/mission-evidence';
import { fetchDebriefForMission } from '../../services/debrief';
import { ReportScreen, type ReportScreenProps } from './ReportScreen';

type Props = { game: GameState } & Pick<
  ReportScreenProps,
  | 'canRetrySol'
  | 'onRetrySol'
  | 'onRetryMission'
  | 'onOpenAlbum'
  | 'onOpenCertificate'
  | 'onClose'
>;
export function MissionReport({ game, ...actions }: Props) {
  const payload = useMemo(() => debriefPayload(game), [game]);
  const [debrief, setDebrief] = useState<DebriefResponse>();
  useEffect(() => {
    let active = true;
    void fetchDebriefForMission({ payload }).then((result) => {
      if (active) setDebrief(result);
    });
    return () => {
      active = false;
    };
  }, [payload]);
  return (
    <ReportScreen
      {...actions}
      ending={game.ending!}
      failedMeter={game.failedMeter}
      history={game.history}
      finalMeters={game.meters}
      skyLevel={game.solarVariant}
      drains={choiceDrains(game)}
      debrief={debrief}
      debriefPending={!debrief}
      albumCount={game.albumIds.length}
      sourcesNote={`Solar input frozen for this run: ${game.sky?.source ?? 'saved'} · ${game.sky?.observedAt ?? game.sky?.fetchedAt ?? game.missionDate}. Saved NASA pictures are separate from those observations.`}
    />
  );
}
