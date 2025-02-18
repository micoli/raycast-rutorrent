import {
  getPreferenceValues,
  LaunchProps, List
} from "@raycast/api";
import fetch from "node-fetch";
const { URLSearchParams } = require('url');


interface Preferences {
  host: string;
  port: string;
  path: string;
  username: string;
  password: string;
}

const preferences: Preferences = getPreferenceValues<Preferences>();

export default function Command(props: LaunchProps<{ launchContext }>) {
  const params = new URLSearchParams();
  params.append('url', atob(props.launchContext.url));

  fetch(`https://${preferences.host}/rutorrent/php/addtorrent.php`,{
    method: 'POST',
    headers: {
      'authorization': 'Basic '+ btoa(`${preferences.username}:${preferences.password}`)
    },
    body: params
  }).then(a=>a.text().then(console.log))

  return (<List>
    <List.Item key="aaa" title="added" />
  </List>);
}
