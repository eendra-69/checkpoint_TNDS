import { getRegulatedPremium } from "../pricing";
import { scoreAll } from "../scoring";
import type {
  CaseState,
  Customer,
  DemoSession,
  Policy,
  SessionSettings,
  VetcActivity,
  Vehicle,
} from "../types";

const FIRST_NAMES = [
  "An", "Bình", "Chi", "Dũng", "Hà", "Hùng", "Khoa", "Lan", "Linh", "Minh",
  "Nam", "Ngọc", "Phương", "Quân", "Sơn", "Thảo", "Trang", "Tuấn", "Vy", "Yến",
];
const LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
];
const MAKES = [
  { make: "Toyota", model: "Vios" },
  { make: "Hyundai", model: "Accent" },
  { make: "Mazda", model: "CX-5" },
  { make: "Kia", model: "Seltos" },
  { make: "Ford", model: "Ranger" },
  { make: "VinFast", model: "VF5" },
  { make: "Honda", model: "City" },
  { make: "Mitsubishi", model: "Xpander" },
];

function pad(n: number, size = 2) {
  return String(n).padStart(size, "0");
}

function plateFor(i: number): string {
  const series = ["30A", "29B", "51F", "43A", "92A"][i % 5];
  return `${series}-${pad(10000 + i, 5)}`;
}

function phoneFor(i: number): string {
  return `09${pad(10000000 + i * 17, 8)}`;
}

function nationalIdFor(i: number): string {
  return `0${pad(79000000000 + i * 91, 11)}`;
}

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Placeholder insurer name stored on synthetic policies; the verify page localizes it. */
export const PILOT_INSURER = "Insurer (pilot partner)";

export const DEMO_CUSTOMERS: Record<
  "minh" | "lan" | "tuan",
  { customer: Customer; vehicle: Vehicle; policy: Policy; vetc: VetcActivity }
> = (() => {
  const now = new Date();
  const minhCustomer: Customer = {
    id: "cust_minh",
    demoKey: "minh",
    fullName: "Minh Nguyen",
    fullNameVi: "Nguyễn Văn Minh",
    phone: "0903123456",
    nationalId: "079085001234",
    email: "minh.nguyen@example.vn",
    preferredLanguage: "vi",
    zaloOptIn: true,
    consent: { messaging: true, calls: true, dataUse: true },
  };
  const minhVehicle: Vehicle = {
    id: "veh_minh",
    customerId: minhCustomer.id,
    plate: "30A-12345",
    make: "Toyota",
    model: "Vios",
    year: 2022,
    vehicleType: "car_under_6",
    incomplete: false,
  };
  const minhPolicy: Policy = {
    id: "pol_minh",
    customerId: minhCustomer.id,
    vehicleId: minhVehicle.id,
    product: "TNDS",
    insurer: PILOT_INSURER,
    premiumVnd: getRegulatedPremium("car_under_6"),
    startsAt: addDays(now, -344),
    expiresAt: addDays(now, 21),
    previousRenewed: true,
  };
  const minhVetc: VetcActivity = {
    customerId: minhCustomer.id,
    tollTripsLast90Days: 42,
    lastTollAt: addDays(now, -1),
    appActive: true,
  };

  const lanCustomer: Customer = {
    id: "cust_lan",
    demoKey: "lan",
    fullName: "Lan Tran",
    fullNameVi: "Trần Thị Lan",
    phone: "0912987654",
    nationalId: "079090005678",
    preferredLanguage: "vi",
    zaloOptIn: true,
    consent: { messaging: true, calls: true, dataUse: true },
  };
  const lanVehicle: Vehicle = {
    id: "veh_lan",
    customerId: lanCustomer.id,
    plate: "51F-67890",
    make: "Hyundai",
    model: "Accent",
    year: 2021,
    vehicleType: "car_under_6",
    incomplete: false,
  };
  const lanPolicy: Policy = {
    id: "pol_lan",
    customerId: lanCustomer.id,
    vehicleId: lanVehicle.id,
    product: "TNDS",
    insurer: PILOT_INSURER,
    premiumVnd: getRegulatedPremium("car_under_6"),
    startsAt: addDays(now, -350),
    expiresAt: addDays(now, 12),
    previousRenewed: true,
  };
  const lanVetc: VetcActivity = {
    customerId: lanCustomer.id,
    tollTripsLast90Days: 18,
    lastTollAt: addDays(now, -4),
    appActive: true,
  };

  const tuanCustomer: Customer = {
    id: "cust_tuan",
    demoKey: "tuan",
    fullName: "Tuan Le",
    fullNameVi: "Lê Hoàng Tuấn",
    phone: "0987654321",
    nationalId: "001088009999",
    preferredLanguage: "vi",
    zaloOptIn: true,
    consent: { messaging: true, calls: false, dataUse: true },
  };
  const tuanVehicle: Vehicle = {
    id: "veh_tuan",
    customerId: tuanCustomer.id,
    plate: "43A-55441",
    make: "Mazda",
    model: "CX-5",
    year: 2020,
    vehicleType: "car_under_6",
    incomplete: true,
  };
  const tuanPolicy: Policy = {
    id: "pol_tuan",
    customerId: tuanCustomer.id,
    vehicleId: tuanVehicle.id,
    product: "TNDS",
    insurer: PILOT_INSURER,
    premiumVnd: getRegulatedPremium("car_under_6"),
    startsAt: addDays(now, -330),
    expiresAt: addDays(now, 28),
    previousRenewed: false,
  };
  const tuanVetc: VetcActivity = {
    customerId: tuanCustomer.id,
    tollTripsLast90Days: 7,
    lastTollAt: addDays(now, -12),
    appActive: false,
  };

  return {
    minh: {
      customer: minhCustomer,
      vehicle: minhVehicle,
      policy: minhPolicy,
      vetc: minhVetc,
    },
    lan: {
      customer: lanCustomer,
      vehicle: lanVehicle,
      policy: lanPolicy,
      vetc: lanVetc,
    },
    tuan: {
      customer: tuanCustomer,
      vehicle: tuanVehicle,
      policy: tuanPolicy,
      vetc: tuanVetc,
    },
  };
})();

function generateBulk(count: number, now: Date) {
  const customers: Customer[] = [];
  const vehicles: Vehicle[] = [];
  const policies: Policy[] = [];
  const vetc: VetcActivity[] = [];

  for (let i = 0; i < count; i++) {
    const id = `cust_${pad(i + 1, 4)}`;
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[i % LAST_NAMES.length];
    const messaging = i % 7 !== 0;
    const calls = i % 5 !== 0;
    const zaloOptIn = messaging && i % 4 !== 0;
    const incomplete = i % 9 === 0;
    const car = MAKES[i % MAKES.length];
    const seats =
      i % 11 === 0 ? "car_over_11" : i % 6 === 0 ? "car_6_to_11" : "car_under_6";
    const expireOffset = -5 + (i % 60);

    const customer: Customer = {
      id,
      fullName: `${first} ${last}`,
      fullNameVi: `${last} ${first}`,
      phone: phoneFor(i),
      nationalId: nationalIdFor(i),
      preferredLanguage: "vi",
      zaloOptIn,
      consent: {
        messaging,
        calls,
        dataUse: i % 11 !== 0,
      },
    };

    const vehicle: Vehicle = {
      id: `veh_${pad(i + 1, 4)}`,
      customerId: id,
      plate: plateFor(i),
      make: car.make,
      model: car.model,
      year: 2018 + (i % 7),
      vehicleType: seats,
      incomplete,
    };

    const policy: Policy = {
      id: `pol_${pad(i + 1, 4)}`,
      customerId: id,
      vehicleId: vehicle.id,
      product: "TNDS",
      insurer: PILOT_INSURER,
      premiumVnd: getRegulatedPremium(seats),
      startsAt: addDays(now, expireOffset - 365),
      expiresAt: addDays(now, expireOffset),
      previousRenewed: i % 3 !== 0,
    };

    const activity: VetcActivity = {
      customerId: id,
      tollTripsLast90Days: (i * 3) % 55,
      lastTollAt: addDays(now, -((i % 20) + 1)),
      appActive: i % 2 === 0,
    };

    customers.push(customer);
    vehicles.push(vehicle);
    policies.push(policy);
    vetc.push(activity);
  }

  return { customers, vehicles, policies, vetc };
}

export function defaultSettings(): SessionSettings {
  return {
    defaultProvider: "gateway",
    defaultModel: process.env.AI_MODEL || "google/gemini-2.5-flash",
    featureOverrides: {},
    providerKeys: {},
    providerBaseUrls: {
      ollama: "http://localhost:11434/v1",
      lmstudio: "http://localhost:1234/v1",
    },
  };
}

export function createSeedSession(sessionId: string): DemoSession {
  const now = new Date();
  const bulk = generateBulk(80, now);
  // Fresh copies: sessions mutate these, and the in-memory store must never touch the shared seed.
  const demo = structuredClone(DEMO_CUSTOMERS);

  const customers = [
    demo.minh.customer,
    demo.lan.customer,
    demo.tuan.customer,
    ...bulk.customers,
  ];
  const vehicles = [
    demo.minh.vehicle,
    demo.lan.vehicle,
    demo.tuan.vehicle,
    ...bulk.vehicles,
  ];
  const policies = [
    demo.minh.policy,
    demo.lan.policy,
    demo.tuan.policy,
    ...bulk.policies,
  ];
  const vetc = [
    demo.minh.vetc,
    demo.lan.vetc,
    demo.tuan.vetc,
    ...bulk.vetc,
  ];

  const scores = scoreAll({ customers, policies, vehicles, vetc });
  const caseStates: Record<string, CaseState> = {};
  for (const c of customers) {
    caseStates[c.id] = "scored";
  }

  return {
    id: sessionId,
    createdAt: now.toISOString(),
    customers,
    vehicles,
    policies,
    vetc,
    scores,
    caseStates,
    conversations: [],
    handovers: [],
    certificates: [],
    claims: [],
    checkouts: [],
    campaigns: [],
    outcomes: [],
    revealedPii: {},
    settings: defaultSettings(),
    funnel: {
      reminded: 0,
      engaged: 0,
      confirmed: 0,
      paid: 0,
      issued: 0,
      handedOver: 0,
    },
  };
}

export const DEMO_CUSTOMER_KEYS = ["minh", "lan", "tuan"] as const;

/** How the story names each demo customer; proper names, the same in VI and EN. */
export const DEMO_CUSTOMER_NAMES = { minh: "Anh Minh", lan: "Chị Lan", tuan: "Anh Tuấn" } as const;

export function getDemoCustomerId(key: "minh" | "lan" | "tuan"): string {
  return DEMO_CUSTOMERS[key].customer.id;
}