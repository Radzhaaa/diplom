import { getAvatarFrame } from '../../utils/avatarFrame';
import { BACKEND_ORIGIN } from '../../services/api';

interface AvatarWithFrameProps {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  level?: number;
  streak?: number;
  size?: number;
  fontSize?: string;
  primaryColor: string;
  accentColor: string;
}

export function AvatarWithFrame({
  firstName, lastName, email, avatar,
  level = 1, streak = 0,
  size = 40, fontSize,
  primaryColor, accentColor,
}: AvatarWithFrameProps) {
  const frame = getAvatarFrame(level, streak);
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`
    : firstName
      ? firstName[0]
      : email
        ? email[0].toUpperCase()
        : '?';

  const fSize = fontSize ?? `${Math.round(size * 0.35)}px`;

  return (
    <div
      className={frame?.animClass}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: fSize,
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: frame?.border ?? '2px solid transparent',
        boxShadow: frame?.boxShadow ?? 'none',
        transition: 'box-shadow 0.3s',
      }}
    >
      {avatar
        ? <img
            src={avatar.startsWith('http') ? avatar : BACKEND_ORIGIN + avatar}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        : initials.toUpperCase()
      }
    </div>
  );
}
