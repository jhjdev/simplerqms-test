export type BaseUser = {
  id: string | number;
  name: string;
  email: string;
  created_at?: string;
};

export type User = BaseUser & {
  type: 'user';
  group_id: string | number | null;
  group_name?: string | null;
};

export interface Group {
  type: 'group';
  id: string | number;
  name: string;
  parent_id: string | number | null;
  level: number;
  users: User[];
  children: Group[];
  created_at: string;
  updated_at: string;
  paddingLeft?: string;
  totalCount?: number;
  userCount?: number;
  groupCount?: number;
}
