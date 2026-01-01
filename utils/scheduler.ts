
import { Worker, Inspector, AreaData, ZoneData, Assignment } from '../types';

export const distributePlans = (workers: Worker[], inspectors: Inspector[]): Assignment[] => {
  const areaMap: Record<string, AreaData> = {};

  workers.forEach(w => {
    if (!areaMap[w.area]) {
      areaMap[w.area] = { name: w.area, totalWorkers: 0, zones: [] };
    }
    
    let zoneObj = areaMap[w.area].zones.find(z => z.name === w.zone);
    if (!zoneObj) {
      zoneObj = { name: w.zone, workers: [] };
      areaMap[w.area].zones.push(zoneObj);
    }
    
    zoneObj.workers.push(w);
    areaMap[w.area].totalWorkers += 1;
  });

  const sortedAreas = Object.values(areaMap).sort((a, b) => b.totalWorkers - a.totalWorkers);

  const assignments: Assignment[] = inspectors.map(i => ({
    inspector: i,
    areas: [],
    totalWorkers: 0
  }));

  sortedAreas.forEach(area => {
    assignments.sort((a, b) => {
      if (a.areas.length !== b.areas.length) {
        return a.areas.length - b.areas.length;
      }
      return a.totalWorkers - b.totalWorkers;
    });

    const target = assignments[0];
    target.areas.push(area);
    target.totalWorkers += area.totalWorkers;
  });

  return assignments;
};
