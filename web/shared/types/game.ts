export interface GameSettings {
  cityName: string;
  companyCount: number;
  startingCapital: number;
  roundCount: number;
}

export interface Company {
  name: string;
  color: "red" | "blue" | "green" | "yellow" | "purple" | undefined;
}
