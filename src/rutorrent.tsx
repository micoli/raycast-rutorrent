import {
  List,
  showToast,
  Toast,
  openCommandPreferences,
  Color,
  ActionPanel,
  Action,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { ruTorrent } from "./global";

interface Torrent {
  hash: string;
  name: string;
  label: string;
  sizeBytes: number;
  leftBytes: number;
  state: string;
  peersConnected: number;
  creationDate: number;
  isActive: number;
  upRate: number;
  downRate: number;
}

export async function listTorrents(): Promise<Torrent[]> {
  try {
    return (
      await ruTorrent.get([
        "d.get_name",
        "d.get_custom1",
        "d.get_size_bytes",
        "d.get_left_bytes",
        "d.get_state",
        "d.get_peers_connected",
        "d.is_active",
        "d.get_creation_date",
        "d.get_up_rate",
        "d.get_down_rate",
      ])
    )
      .map((row) => {
        return {
          hash: row["hashString"],
          name: row["d.get_name"],
          label: row["d.get_custom1"],
          sizeBytes: parseInt(row["d.get_size_bytes"]),
          leftBytes: parseInt(row["d.get_left_bytes"]),
          state: parseInt(row["d.get_state"]),
          peersConnected: parseInt(row["d.get_peers_connected"]),
          isActive: parseInt(row["d.is_active"]),
          creationDate: parseInt(row["d.get_creation_date"]),
          upRate: parseInt(row["d.get_up_rate"]),
          downRate: parseInt(row["d.get_down_rate"]),
        };
      })
      .sort((A: Torrent, B: Torrent) =>
        A.creationDate == B.creationDate ? 0 : A.creationDate > B.creationDate ? -1 : 1,
      );
  } catch (error) {
    console.log(error);
    return [];
  }
}

const formatBytes = (bytes:number, decimals:number) => {
  if (bytes == 0) return "0 Bytes";
  const k = 1024,
    dm = decimals || 2,
    sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export default function Command() {
  const [torrents, setTorrents] = useState<Torrent[]>([]);

  function refreshList() {
    const fetchAndSetHosts = async () => {
      try {
        setTorrents(await listTorrents());
      } catch (error) {
        console.error(error);
        await showToast({ style: Toast.Style.Failure, title: String(error) });
      }
    };
    fetchAndSetHosts().then();
  }

  useEffect(refreshList, []);

  return (
    <List>
      {torrents.map((host) => {
        const accessories: List.Item.Accessory[] = [];

        if (host.upRate)
          accessories.push({
            text: {
              value: `▵︎${formatBytes(host.upRate, 2)}`,
              color: Color.Purple,
            },
          });

        if (host.leftBytes !== 0)
          accessories.push({
            text: `${formatBytes(host.leftBytes, 2)} (${host.peersConnected})`,
          });

        if (host.downRate)
          accessories.push({
            text: {
              value: `︎▽${formatBytes(host.downRate, 2)}`,
              color: Color.Blue,
            },
          });

        accessories.push({
          tag: {
            value: host.label,
            color: Color.Blue,
          },
        });

        const leftPercentage = ((host.sizeBytes - host.leftBytes) / host.sizeBytes) * 100;
        let leftPercentageColor = Color.Green;
        if (leftPercentage < 90) leftPercentageColor = Color.Yellow;
        if (leftPercentage < 60) leftPercentageColor = Color.Orange;
        if (leftPercentage < 30) leftPercentageColor = Color.Red;
        accessories.push({
          text: { value: `${leftPercentage.toFixed(2)}%`, color: leftPercentageColor },
        });

        return (
          <List.Item
            key={host.hash}
            title={host.name}
            accessories={accessories}
            actions={
              <ActionPanel>
                <Action
                  title="Refresh"
                  onAction={() => {
                    refreshList();
                  }}
                />
                <Action
                  title="Delete"
                  onAction={() => {
                    ruTorrent.delete(host.hash).then(refreshList);
                  }}
                />
                <Action title="Open Extension Preferences" onAction={openCommandPreferences} />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
