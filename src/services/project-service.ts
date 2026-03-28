import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/firebase';

export type ProjectStatus = 'recruiting' | 'in_progress' | 'completed';
export type ProjectCategory = 'Agriculture' | 'Health' | 'Fintech' | 'Education' | 'Community' | 'Hardware';

export interface Project {
  id: string;
  title: string;
  description: string;
  studentLeadId: string;
  members: Record<string, string>; // Map of UID -> Role
  status: ProjectStatus;
  category: ProjectCategory;
  skillsNeeded: string[];
  teamSize: { total: number };
  createdAt: any;
}

export const projectService = {
  async getActiveProjects(): Promise<Project[]> {
    const q = query(collection(firestore, 'projects'), where('status', 'in', ['recruiting', 'in_progress']));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
  },

  async createProject(creatorId: string, data: Partial<Project>) {
    const projectRef = doc(collection(firestore, 'projects'));
    const newProject = {
      ...data,
      id: projectRef.id,
      studentLeadId: creatorId,
      status: 'recruiting',
      members: {
        [creatorId]: 'leader'
      },
      createdAt: serverTimestamp(),
    };
    await setDoc(projectRef, newProject);
    return newProject;
  },

  async joinProject(projectId: string, userId: string, role: string = 'member') {
    const projectRef = doc(firestore, 'projects', projectId);
    const project = await getDoc(projectRef);
    
    if (!project.exists()) throw new Error('Project not found');
    
    const members = project.data().members || {};
    members[userId] = role;

    await updateDoc(projectRef, { members });
  }
};
