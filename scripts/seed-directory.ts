import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const services = [
  {
    name: "Austin Resource Center for the Homeless (ARCH)",
    category: "Shelter",
    address: "500 E 7th St, Austin, TX 78701",
    phone: "(512) 305-4100",
    hours: "Daily 8am–8pm",
    notes: "Day services, showers, mail, case management. Men's emergency overflow available.",
    website: "https://www.frontsteps.org",
  },
  {
    name: "Front Steps Emergency Shelter",
    category: "Shelter",
    address: "500 E 7th St, Austin, TX 78701",
    phone: "(512) 305-4100",
    hours: "Nightly 7pm–7am",
    notes: "Emergency overnight shelter for adults. ID not required for initial stay.",
    website: "https://www.frontsteps.org",
  },
  {
    name: "Salvation Army Austin",
    category: "Shelter",
    address: "501 E 8th St, Austin, TX 78701",
    phone: "(512) 476-1111",
    hours: "Mon–Fri 8am–5pm, emergency shelter year-round",
    notes: "Emergency shelter, transitional housing, food pantry, and case management.",
    website: "https://austintx.salvationarmy.org",
  },
  {
    name: "LifeWorks Transitional Housing",
    category: "Shelter",
    address: "835 N Pleasant Valley Rd, Austin, TX 78702",
    phone: "(512) 735-2400",
    hours: "Mon–Fri 8am–6pm",
    notes: "Housing services for youth ages 18–24 experiencing homelessness.",
    website: "https://www.lifeworksaustin.org",
  },
  {
    name: "Mobile Loaves & Fishes Community First! Village",
    category: "Shelter",
    address: "9301 Hog Eye Rd, Austin, TX 78724",
    phone: "(512) 328-7299",
    hours: "Office Mon–Fri 9am–5pm",
    notes: "Permanent micro-home community for chronically homeless adults.",
    website: "https://mlf.org",
  },
  {
    name: "Central Texas Food Bank",
    category: "Food",
    address: "6500 Metropolis Dr, Austin, TX 78744",
    phone: "(512) 282-2111",
    hours: "Tue & Thu 9am–12pm (client pantry)",
    notes: "Largest food bank in Central Texas. Serves multiple Austin distribution sites.",
    website: "https://www.centraltexasfoodbank.org",
  },
  {
    name: "Micah 6 Food Pantry",
    category: "Food",
    address: "2800 Webberville Rd, Austin, TX 78702",
    phone: "(512) 478-0536",
    hours: "Tue 9am–12pm, Thu 1pm–4pm",
    notes: "Free groceries for Austin residents, no ID required.",
  },
  {
    name: "Community Oriented Meals Program (COmP)",
    category: "Food",
    address: "Various sites across Austin",
    phone: "(512) 476-5982",
    hours: "Multiple daily shifts",
    notes: "Hot meals served at multiple outdoor locations throughout Austin daily.",
  },
  {
    name: "People's Community Clinic",
    category: "Healthcare",
    address: "1101 Camino La Costa, Austin, TX 78752",
    phone: "(512) 478-4939",
    hours: "Mon–Fri 8am–5pm",
    notes: "Sliding-scale primary care, dental, behavioral health. Walk-ins accepted.",
    website: "https://www.austinpcc.org",
  },
  {
    name: "CommUnity Care Health Centers",
    category: "Healthcare",
    address: "Multiple Austin locations",
    phone: "(512) 978-9100",
    hours: "Mon–Fri 8am–5pm",
    notes: "Federally qualified health center. Income-based sliding fee. Accepts Medicaid/uninsured.",
    website: "https://communitycaretx.org",
  },
  {
    name: "Austin Travis County Integral Care",
    category: "Healthcare",
    address: "1430 Collier St, Austin, TX 78704",
    phone: "(512) 472-4357",
    hours: "24/7 crisis line, Mon–Fri 8am–5pm for services",
    notes: "Mental health and substance use services. Crisis hotline available 24/7.",
    website: "https://integralcare.org",
  },
  {
    name: "Lone Star Legal Aid",
    category: "Legal",
    address: "1602 E Cesar Chavez St, Austin, TX 78702",
    phone: "(512) 447-7707",
    hours: "Mon–Fri 9am–5pm",
    notes: "Free civil legal services for low-income Texans. Appointments and walk-ins.",
    website: "https://www.lonestarlegal.org",
  },
  {
    name: "Texas RioGrande Legal Aid (TRLA)",
    category: "Legal",
    address: "4920 N IH 35, Austin, TX 78751",
    phone: "(512) 374-2700",
    hours: "Mon–Fri 9am–5pm",
    notes: "Free legal help for eligible low-income residents. Specializes in housing, benefits.",
    website: "https://trla.org",
  },
  {
    name: "Austin Recovery",
    category: "Recovery",
    address: "8402 Cross Park Dr, Austin, TX 78754",
    phone: "(512) 697-7777",
    hours: "Mon–Fri 8am–5pm",
    notes: "Residential treatment, outpatient programs, and detox services.",
    website: "https://austinrecovery.org",
  },
  {
    name: "The Salvation Army Adult Rehabilitation Center",
    category: "Recovery",
    address: "4216 S Congress Ave, Austin, TX 78745",
    phone: "(512) 448-9200",
    hours: "Mon–Fri 8am–5pm (intake)",
    notes: "6-month residential work therapy program for substance use recovery. Free.",
  },
  {
    name: "AA Central Office Austin",
    category: "Recovery",
    address: "1005 E St Elmo Rd, Austin, TX 78745",
    phone: "(512) 444-0071",
    hours: "Mon–Fri 9am–5pm, meeting finder 24/7",
    notes: "Find local Alcoholics Anonymous meetings across Austin. Free.",
    website: "https://www.austinaa.org",
  },
  {
    name: "Workforce Solutions Capital Area",
    category: "Employment",
    address: "6505 Airport Blvd, Austin, TX 78752",
    phone: "(512) 597-7100",
    hours: "Mon–Fri 8am–5pm",
    notes: "Free job training, resume help, job fairs, and career coaching.",
    website: "https://www.wfscapitalarea.com",
  },
  {
    name: "Goodwill Career and Technical Academy",
    category: "Employment",
    address: "1015 Norwood Park Blvd, Austin, TX 78753",
    phone: "(512) 637-7100",
    hours: "Mon–Fri 8am–5pm",
    notes: "Free job training programs in healthcare, technology, and skilled trades.",
    website: "https://www.goodwillcta.org",
  },
  {
    name: "Austin/Travis County EMS Crisis Line",
    category: "Crisis",
    address: "Austin, TX",
    phone: "(512) 472-4357",
    hours: "24/7",
    notes: "Mental health crisis support. Call or text. Trained responders dispatched to scene.",
  },
  {
    name: "Safe Alliance Domestic Violence Hotline",
    category: "Crisis",
    address: "P.O. Box 1210, Austin, TX 78767",
    phone: "(512) 267-7233",
    hours: "24/7 hotline",
    notes: "Crisis intervention, emergency shelter, legal advocacy for domestic violence survivors.",
    website: "https://www.safeaustin.org",
  },
  {
    name: "Texas 211",
    category: "Crisis",
    address: "Statewide — Austin area covered",
    phone: "211",
    hours: "24/7",
    notes: "Connects Texans with local health and human services. Shelter, food, utilities, and more.",
    website: "https://www.211texas.org",
  },
  {
    name: "Caritas of Austin",
    category: "Shelter",
    address: "611 Neches St, Austin, TX 78701",
    phone: "(512) 479-0466",
    hours: "Mon–Fri 8:30am–4:30pm",
    notes: "Case management, transitional and permanent supportive housing programs.",
    website: "https://caritasofaustin.org",
  },
  {
    name: "Austin Public Health Dental Clinic",
    category: "Healthcare",
    address: "1161 Airport Blvd, Austin, TX 78702",
    phone: "(512) 972-5766",
    hours: "Mon–Fri 8am–4pm (by appointment)",
    notes: "Low-cost dental care for uninsured and low-income patients.",
  },
];

async function main() {
  console.log("Seeding Austin services directory...");

  await prisma.serviceDirectory.deleteMany({});

  for (const s of services) {
    await prisma.serviceDirectory.create({ data: s });
  }

  console.log(`Seeded ${services.length} services.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
