import campusLoginHero from './images/campus_login_hero_1794676789105.jpg';
import avatarAdmin from './images/avatar_admin_1794676788954.jpg';
import avatarTeacher from './images/avatar_teacher_1794676788970.jpg';
import avatarStudentOne from './images/avatar_student_one_1794676789214.jpg';
import avatarStudentTwo from './images/avatar_student_two_1794676790288.jpg';

export const CAMPUS_HERO_IMAGE = campusLoginHero;

export const PRESET_AVATARS: Record<string, string> = {
  avatar_admin: avatarAdmin,
  avatar_teacher: avatarTeacher,
  avatar_student_one: avatarStudentOne,
  avatar_student_two: avatarStudentTwo,
};

export function resolveAvatarUrl(avatarKey?: string): string | null {
  if (!avatarKey) return null;
  if (avatarKey.startsWith('data:') || avatarKey.startsWith('http') || avatarKey.startsWith('/')) {
    return avatarKey;
  }
  return PRESET_AVATARS[avatarKey] || null;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'NB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
