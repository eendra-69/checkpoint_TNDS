/** @deprecated Prefer importing from ./world/map */
export type { OfficeStation } from "./world/map";
export { INTERACTABLES as STATION_LIST } from "./world/map";

export const STATION_META = {
  cs: { label: "Tasco CS", prompt: "Nói chuyện với CS", position: [15, 0, 2.5] as [number, number, number] },
  claims: { label: "Bồi thường", prompt: "Khai báo bồi thường", position: [4, 0, 2.5] as [number, number, number] },
  admin: { label: "Hồ sơ", prompt: "Theo dõi hồ sơ", position: [2.5, 0, 2.2] as [number, number, number] },
  vetc: { label: "VETC", prompt: "Gia hạn qua VETC", position: [17.2, 0, 7.6] as [number, number, number] },
  reception: { label: "Lễ tân", prompt: "Chào mừng", position: [9.5, 0, 7.4] as [number, number, number] },
};
