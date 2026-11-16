export type SampleReview = { id: string; name: string; rating: number; text: string; date: string; sample: true; catAvatar: boolean; catVariant: 0 | 1 | 2 | 3 };

const locations = ["the counter", "the dining area", "the drive-through", "the ordering kiosk", "the pickup counter"];
const openings = [
  "Stopped by for breakfast and ordered a coffee and sandwich.",
  "Picked up lunch while running errands.",
  "Came in with some friends for a quick meal.",
  "Visited with my family on a busy afternoon.",
  "Used the drive-through on my way home.",
  "Grabbed a snack before heading back to work.",
  "Had a late dinner here after a long day.",
  "Tried a new menu item during my lunch break.",
  "Ordered fries, a burger, and a drink.",
  "Came by for an ice cream and a short break.",
  "Visited during the morning rush.",
  "Ordered at the self-service kiosk.",
  "Went in to get some food before a movie.",
  "Stopped for a coffee on a rainy day.",
  "Had a quick meal here on the weekend.",
  "Came here after shopping nearby.",
  "Dropped in while traveling through the area.",
  "Ordered a small snack and sat by the window.",
  "Had a casual dinner with a friend.",
  "Picked up an order to take home."
];
const observations = [
  "The staff were welcoming, and the order arrived quickly.",
  "There was a short wait, but the food came out hot.",
  "The tables were tidy and there was plenty of seating.",
  "Everything was packed neatly and easy to carry.",
  "The fries were fresh and the service was efficient.",
  "The restaurant was busy, though the line moved steadily.",
  "My order was correct and the team was helpful.",
  "The service was friendly and the atmosphere felt relaxed.",
  "The seating area could have been cleaner.",
  "It took longer than expected to get the food.",
  "The team handled a busy period pretty well.",
  "I liked how simple the ordering process was.",
  "The drinks were good, but the fries were a little cold.",
  "There was plenty of space for us to sit.",
  "The food was tasty, and the staff checked the order.",
  "I had a small issue with my order, but it was fixed.",
  "The pickup process was straightforward.",
  "The restaurant looked clean and the staff were polite.",
  "My order was missing an item, so I had to go back.",
  "The food was fine, but the wait could have been shorter."
];
const endings = [
  "I'd stop by again.",
  "Overall, a pleasant visit.",
  "Good for a quick bite.",
  "I hope the wait is shorter next time.",
  "It was pretty much what I expected.",
  "I'd come back for the coffee.",
  "Nice spot for a convenient meal.",
  "The experience was okay overall.",
  "I appreciated the friendly service.",
  "A decent stop during a busy day."
];

/** Fictional layout fixtures, never real customer testimony. */
const firstNames = ["Alex","Jordan","Taylor","Morgan","Casey","Avery","Jamie","Riley","Quinn","Sam","Cameron","Drew","Parker","Charlie","Reese","Bailey","Sydney","Skyler","Rowan","Robin","Jessie","Emerson","Hayden","Elliot","Frankie","Kendall","Shawn","Dakota","Harper","Arden","Lee","Micah","Sage","Noel","Reagan","Finley","Marley","Kit","Jules","Blair","Devin","Toby","Corey","Ash","Remy","Cody","Milan","Logan","Nico","Ellis"];
const lastNames = ["Anderson","Bennett","Carter","Davis","Edwards","Foster","Garcia","Harris","Iverson","Johnson","King","Lewis","Miller","Nelson","Ortiz","Parker","Quinn","Reed","Sullivan","Turner","Vargas","Walker","Young","Zimmerman","Brooks","Collins","Diaz","Evans","Flores","Graham","Hughes","Ingram","Jenkins","Knight","Lopez","Mitchell","Owens","Price","Rivera","Stewart"];

export const sampleReviews: SampleReview[] = Array.from({ length: 1537 }, (_, i) => {
  const rating = [5, 4, 5, 3, 4, 2, 5, 4, 3, 1][i % 10];
  const place = locations[(i * 3) % locations.length];
  const text = openings[i % openings.length] + " " +
    observations[(i * 7 + Math.floor(i / 20)) % observations.length] + " " +
    (i % 4 === 0 ? "I spent a few minutes near " + place + ". " : "") +
    endings[(i * 3 + Math.floor(i / 10)) % endings.length];
  const daysAgo = (i * 7 + Math.floor(i / 20)) % 30;
  return {
    id: "sample-" + (i + 1),
    name: firstNames[i % firstNames.length] + " " + lastNames[Math.floor(i / firstNames.length) % lastNames.length],
    rating,
    text,
    date: new Date(Date.UTC(2026, 10, 16 - daysAgo, 12)).toISOString(),
    catAvatar: (i * 73) % 1537 < 617,
    catVariant: (i % 4) as 0 | 1 | 2 | 3,
    sample: true as const
  };
});
