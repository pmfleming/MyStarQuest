import type { SharingTreat } from '../../data/sharingFriends'

export default function SharingToken({
  treat,
  dropped = false,
}: {
  treat: SharingTreat
  dropped?: boolean
}) {
  return (
    <img
      className={
        dropped ? 'sharing-token sharing-token-dropped' : 'sharing-token'
      }
      src={treat.src}
      alt=""
      draggable={false}
    />
  )
}
