import ReactPlayer from "react-player";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function UserCard({ email, username, stream }) {
  const initials = String(username)?.toUpperCase()?.split(' ')?.join('');

  return (
    <Card className={'w-auto h-100 aspect-video relative'}>
      <ReactPlayer
        playing
        muted
        height="100px"
        width="200px"
        url={stream}
      />
      <CardFooter className={'flex-col absolute bottom-0 py-4 bg-muted w-full'}>
        <div className="flex items-center gap-2">
          <Avatar className="size-12">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <CardTitle className={'text-lg font-bold'}>{username}</CardTitle>
        </div>
        <CardDescription className={'text-xs'}>{email}</CardDescription>
      </CardFooter>
    </Card>
  )
}
