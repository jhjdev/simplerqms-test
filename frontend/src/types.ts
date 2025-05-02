export type BaseUser = {
  id: string;
  name: string;
  email: string;
};

export type User = BaseUser & {
  type: 'user';
  groupId: string | null;
  group_id?: string | null;
  group_name?: string | null;
};

export interface Group {
  type: 'group';
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  users: User[];
  children: Group[];
  created_at: string;
  updated_at: string;
  paddingLeft?: string;
};
