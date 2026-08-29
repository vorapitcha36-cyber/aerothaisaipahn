export const REGION_LABELS = {
  north: "ภาคเหนือ",
  northeast: "ภาคตะวันออกเฉียงเหนือ",
  central: "ภาคกลาง",
  east: "ภาคตะวันออก",
  west: "ภาคตะวันตก",
  south: "ภาคใต้",
};

const area = (id, shortName, type, provinceCode, regionKey, coordinates, parentCenterId = null) => ({
  id,
  name: `${type === "center" ? "ศูนย์ควบคุมการบิน" : "หอควบคุมจราจรทางอากาศ"}${shortName}`,
  shortName,
  type,
  parentCenterId,
  provinceCode,
  regionKey,
  coordinates,
  towers: [],
});

const centerDefinitions = [
  ["cnx", "เชียงใหม่", "TH-50", "north", [98.9931, 18.7877]],
  ["phs", "พิษณุโลก", "TH-65", "north", [100.2659, 16.8211]],
  ["udon", "อุดรธานี", "TH-41", "northeast", [102.787, 17.4138]],
  ["ubon", "อุบลราชธานี", "TH-34", "northeast", [104.8564, 15.2287]],
  ["korat", "นครราชสีมา", "TH-30", "northeast", [102.0978, 14.9799]],
  ["phuket", "ภูเก็ต", "TH-83", "south", [98.3923, 7.8804]],
  ["hatyai", "หาดใหญ่", "TH-90", "south", [100.4747, 7.0084]],
  ["surat", "สุราษฎร์ธานี", "TH-84", "south", [99.3215, 9.1382]],
  ["huahin", "หัวหิน", "TH-76", "west", [99.9577, 12.5684]],
];

const towerDefinitions = [
  ["mae-hong-son", "แม่ฮ่องสอน", "cnx", "TH-58", "north", [97.9758, 19.3013]],
  ["chiang-rai", "เชียงราย", "cnx", "TH-57", "north", [99.8325, 19.9105]],
  ["lampang", "ลำปาง", "cnx", "TH-52", "north", [99.5044, 18.2888]],
  ["sukhothai", "สุโขทัย", "phs", "TH-64", "north", [99.8221, 17.238]],
  ["phetchabun", "เพชรบูรณ์", "phs", "TH-67", "north", [101.1606, 16.419]],
  ["nan", "น่าน", "phs", "TH-55", "north", [100.773, 18.7756]],
  ["phrae", "แพร่", "phs", "TH-54", "north", [100.141, 18.1446]],
  ["mae-sot", "แม่สอด", "phs", "TH-63", "west", [98.5451, 16.6992]],
  ["nakhon-phanom", "นครพนม", "udon", "TH-48", "northeast", [104.7696, 17.4108]],
  ["sakon-nakhon", "สกลนคร", "udon", "TH-47", "northeast", [104.147, 17.1664]],
  ["loei", "เลย", "udon", "TH-42", "northeast", [101.7223, 17.486]],
  ["khon-kaen", "ขอนแก่น", "udon", "TH-40", "northeast", [102.835, 16.4419]],
  ["roi-et", "ร้อยเอ็ด", "ubon", "TH-45", "northeast", [103.653, 16.0538]],
  ["buriram", "บุรีรัมย์", "korat", "TH-31", "northeast", [103.119, 14.993]],
  ["ranong", "ระนอง", "phuket", "TH-85", "south", [98.6348, 9.9529]],
  ["krabi", "กระบี่", "phuket", "TH-81", "south", [98.9063, 8.0863]],
  ["trang", "ตรัง", "hatyai", "TH-92", "south", [99.6114, 7.5563]],
  ["narathiwat", "นราธิวาส", "hatyai", "TH-96", "south", [101.821, 6.4255]],
  ["betong", "เบตง", "hatyai", "TH-95", "south", [101.0723, 5.7734]],
  ["chumphon", "ชุมพร", "surat", "TH-86", "south", [99.187, 10.493]],
  ["samui", "สมุย", "surat", "TH-84", "south", [100.062, 9.512]],
  ["nakhon-si", "นครศรีธรรมราช", "surat", "TH-80", "south", [99.9631, 8.4304]],
  ["trat", "ตราด", "huahin", "TH-23", "east", [102.515, 12.2428]],
];

const centers = centerDefinitions.map(([id, name, province, region, coordinates]) =>
  area(id, name, "center", province, region, coordinates),
);
const towers = towerDefinitions.map(([id, name, parent, province, region, coordinates]) =>
  area(id, name, "tower", province, region, coordinates, parent),
);

export const AREAS = [...centers, ...towers].map((item) =>
  item.type === "center"
    ? { ...item, towers: towers.filter((tower) => tower.parentCenterId === item.id).map((tower) => tower.id) }
    : item,
);

export const COMPLIANCE_TOPICS = [
  { id: "emergency-plan", shortName: "แผนเผชิญเหตุ CNS", name: "แผนเผชิญเหตุด้านการรักษาความปลอดภัย CNS", reviewIntervalMonths: 12, active: true },
  { id: "emergency-drill", shortName: "การฝึกซ้อมแผน", name: "การฝึกซ้อมแผนเผชิญเหตุ", reviewIntervalMonths: 12, active: true },
  { id: "risk-assessment", shortName: "ประเมินความเสี่ยง", name: "การประเมินความเสี่ยงด้านการรักษาความปลอดภัย", reviewIntervalMonths: 6, active: true },
  { id: "security-awareness", shortName: "Security Awareness", name: "การอบรม Security Awareness", reviewIntervalMonths: 12, active: true },
  { id: "security-staff", shortName: "ข้อมูลพนักงาน รปภ.", name: "ข้อมูลพนักงานรักษาความปลอดภัย", reviewIntervalMonths: 12, active: true },
  { id: "work-instruction", shortName: "วิธีปฏิบัติงาน (WI)", name: "วิธีปฏิบัติงานประจำจุด (WI)", reviewIntervalMonths: 12, active: true },
  { id: "security-audit", shortName: "ผลตรวจสอบมาตรฐาน", name: "ผลตรวจสอบมาตรฐานการรักษาความปลอดภัย", reviewIntervalMonths: 12, active: true },
];

export const PROVINCE_REGION = {
  "TH-10": "central", "TH-11": "central", "TH-12": "central", "TH-13": "central", "TH-14": "central", "TH-15": "central", "TH-16": "central", "TH-17": "central", "TH-18": "central", "TH-19": "central", "TH-26": "central",
  "TH-20": "east", "TH-21": "east", "TH-22": "east", "TH-23": "east", "TH-24": "east", "TH-25": "east", "TH-27": "east",
  "TH-30": "northeast", "TH-31": "northeast", "TH-32": "northeast", "TH-33": "northeast", "TH-34": "northeast", "TH-35": "northeast", "TH-36": "northeast", "TH-37": "northeast", "TH-38": "northeast", "TH-39": "northeast", "TH-40": "northeast", "TH-41": "northeast", "TH-42": "northeast", "TH-43": "northeast", "TH-44": "northeast", "TH-45": "northeast", "TH-46": "northeast", "TH-47": "northeast", "TH-48": "northeast", "TH-49": "northeast",
  "TH-50": "north", "TH-51": "north", "TH-52": "north", "TH-53": "north", "TH-54": "north", "TH-55": "north", "TH-56": "north", "TH-57": "north", "TH-58": "north", "TH-60": "north", "TH-61": "north", "TH-62": "north", "TH-64": "north", "TH-65": "north", "TH-66": "north", "TH-67": "north",
  "TH-63": "west", "TH-70": "west", "TH-71": "west", "TH-72": "west", "TH-76": "west", "TH-77": "west",
  "TH-80": "south", "TH-81": "south", "TH-82": "south", "TH-83": "south", "TH-84": "south", "TH-85": "south", "TH-86": "south", "TH-90": "south", "TH-91": "south", "TH-92": "south", "TH-93": "south", "TH-94": "south", "TH-95": "south", "TH-96": "south",
};

export const REGION_COLORS = {
  north: "#bae6fd",
  northeast: "#ddd6fe",
  central: "#bfdbfe",
  east: "#a7f3d0",
  west: "#fde68a",
  south: "#99f6e4",
};

export const DEFAULT_SETTINGS = {
  dashboardName: "ภาพรวมมาตรฐานการรักษาความปลอดภัย",
  organizationName: "บริษัท วิทยุการบินแห่งประเทศไทย จำกัด",
  adminDisplayName: "ผู้ดูแลระบบ",
  adminPhoto: null,
  overviewLabel: "ภาพรวมระบบ",
  dataManagementLabel: "การจัดการข้อมูล",
  internalSystemLabel: "ระบบภายในองค์กร",
};
