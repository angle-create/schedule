interface Schedule {
  id: string;
  creator_id: string;
  participant_ids?: string[];
}

interface User {
  id: string;
  role?: 'admin' | 'member';
}

export const canEditSchedule = (schedule: Schedule, user: User | null): boolean => {
  if (!user) return false;
  
  // 管理者は全ての予定を編集可能
  if (user.role === 'admin') return true;
  
  // 作成者は自分の予定を編集可能
  return schedule.creator_id === user.id;
};

export const canUpdateParticipantStatus = (schedule: Schedule, user: User | null): boolean => {
  if (!user) return false;
  
  // 管理者は全ての予定のステータスを更新可能
  if (user.role === 'admin') return true;
  
  // 参加者は自分の参加ステータスを更新可能
  return schedule.participant_ids?.includes(user.id) || false;
};

export const canManageUsers = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'admin';
};

export const canViewSchedule = (schedule: Schedule, user: User | null): boolean => {
  if (!user) return false;
  
  // 管理者は全ての予定を閲覧可能
  if (user.role === 'admin') return true;
  
  // 作成者は自分の予定を閲覧可能
  if (schedule.creator_id === user.id) return true;
  
  // 参加者は参加している予定を閲覧可能
  return schedule.participant_ids?.includes(user.id) || false;
}; 