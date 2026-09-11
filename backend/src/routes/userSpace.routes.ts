import { Router, Request, Response } from 'express';
import {
  getActiveLocations,
  getAllFacilities,
  searchSpaces,
  getSpaceDetails,
} from '../services/userSpace.service';

const router = Router();

router.get('/locations', async (_req: Request, res: Response) => {
  const locations = await getActiveLocations();
  return res.json({ locations });
});

router.get('/facilities', async (_req: Request, res: Response) => {
  const facilities = await getAllFacilities();
  return res.json({ facilities });
});

router.get('/', async (req: Request, res: Response) => {
  const { locationId, search, facilities } = req.query;

  // 1. Build a filter object containing ONLY defined values
  const filterParams: {
    locationId?: string;
    search?: string;
    facilityIds?: string[];
  } = {};

  if (typeof locationId === 'string' && locationId) {
    filterParams.locationId = locationId;
  }

  if (typeof search === 'string' && search) {
    filterParams.search = search;
  }

  if (typeof facilities === 'string' && facilities.trim().length > 0) {
    filterParams.facilityIds = facilities.split(',');
  }

  // 2. Pass clean filter object without any explicit 'undefined' keys
  const spaces = await searchSpaces(filterParams);

  return res.json({ spaces });
});

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid space ID' });
  }

  const space = await getSpaceDetails(id);
  if (!space) return res.status(404).json({ message: 'Space not found' });
  return res.json({ space });
});

export default router;