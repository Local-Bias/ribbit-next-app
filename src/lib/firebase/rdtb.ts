import { getDatabase } from 'firebase/database';
import './initialize-firebase';

export const rtdb = getDatabase();
