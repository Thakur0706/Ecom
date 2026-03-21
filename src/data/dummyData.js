export const products = [
  {
    id: 1,
    title: 'Data Structures Handbook',
    description:
      'A neatly maintained handbook with solved examples for coding interviews, class tests, and quick revision before lab exams.',
    category: 'Books',
    price: 180,
    condition: 'Good',
    image: 'https://picsum.photos/seed/1/400/300',
    seller: 'Aarav Sharma',
    rating: 4.6,
    reviews: [
      { name: 'Megha', rating: 5, comment: 'Clean pages and very helpful notes inside.' },
      { name: 'Ritvik', rating: 4, comment: 'Exactly as described and useful for placements.' },
    ],
  },
  {
    id: 2,
    title: 'Wireless Scientific Calculator',
    description:
      'Reliable calculator for engineering mathematics and physics sessions. Battery life is strong and display is bright.',
    category: 'Electronics',
    price: 420,
    condition: 'Good',
    image: 'https://picsum.photos/seed/2/400/300',
    seller: 'Nisha Verma',
    rating: 4.4,
    reviews: [
      { name: 'Tanvi', rating: 4, comment: 'Worked perfectly during internals.' },
      { name: 'Harsh', rating: 5, comment: 'Buttons are responsive and easy to use.' },
    ],
  },
  {
    id: 3,
    title: 'Campus Hoodie 2025 Edition',
    description:
      'Official student club hoodie in excellent shape. Soft fleece lining and roomy fit for everyday classes.',
    category: 'Accessories',
    price: 550,
    condition: 'New',
    image: 'https://picsum.photos/seed/3/400/300',
    seller: 'Ishita Rao',
    rating: 4.8,
    reviews: [
      { name: 'Dev', rating: 5, comment: 'Looks brand new and fits well.' },
      { name: 'Samaira', rating: 5, comment: 'Warm, stylish, and worth the price.' },
    ],
  },
  {
    id: 4,
    title: 'Analog Electronics Notes Bundle',
    description:
      'Printed and spiral-bound notes with diagrams, previous-year questions, and concise unit summaries.',
    category: 'Books',
    price: 140,
    condition: 'Fair',
    image: 'https://picsum.photos/seed/4/400/300',
    seller: 'Karan Patel',
    rating: 4.1,
    reviews: [
      { name: 'Neha', rating: 4, comment: 'Useful if you need exam prep material fast.' },
      { name: 'Aditya', rating: 4, comment: 'Some wear, but the content is solid.' },
    ],
  },
  {
    id: 5,
    title: 'Bluetooth Earbuds',
    description:
      'Compact earbuds with charging case, good battery backup, and balanced sound for lectures or workouts.',
    category: 'Electronics',
    price: 780,
    condition: 'Good',
    image: 'https://picsum.photos/seed/5/400/300',
    seller: 'Priya Menon',
    rating: 4.5,
    reviews: [
      { name: 'Arjun', rating: 4, comment: 'Audio is crisp and pairing is easy.' },
      { name: 'Mitali', rating: 5, comment: 'Battery lasted longer than expected.' },
    ],
  },
  {
    id: 6,
    title: 'Mechanical Drawing Kit',
    description:
      'Complete drafter kit including set squares, compass, pencils, and templates for first-year students.',
    category: 'Accessories',
    price: 230,
    condition: 'Good',
    image: 'https://picsum.photos/seed/6/400/300',
    seller: 'Vikram Joshi',
    rating: 4.2,
    reviews: [
      { name: 'Sanya', rating: 4, comment: 'Everything needed was included.' },
      { name: 'Rohan', rating: 4, comment: 'A practical and affordable starter kit.' },
    ],
  },
  {
    id: 7,
    title: 'Operating Systems Textbook',
    description:
      'Reference textbook with highlighted key concepts and chapter-end summaries for faster review.',
    category: 'Books',
    price: 320,
    condition: 'Good',
    image: 'https://picsum.photos/seed/7/400/300',
    seller: 'Ananya Desai',
    rating: 4.7,
    reviews: [
      { name: 'Kabir', rating: 5, comment: 'The highlighted sections made revision easy.' },
      { name: 'Veda', rating: 4, comment: 'Very useful for semester prep.' },
    ],
  },
  {
    id: 8,
    title: 'Minimal Laptop Sleeve',
    description:
      'Water-resistant sleeve for 14-inch laptops with extra zip compartment for charger and notebook.',
    category: 'Accessories',
    price: 260,
    condition: 'New',
    image: 'https://picsum.photos/seed/8/400/300',
    seller: 'Rahul Kapoor',
    rating: 4.3,
    reviews: [
      { name: 'Pooja', rating: 4, comment: 'Clean finish and nice padding.' },
      { name: 'Aman', rating: 4, comment: 'Good quality for the cost.' },
    ],
  },
];

export const services = [
  {
    id: 1,
    title: 'Math Tutoring for First Year',
    description:
      'One-on-one tutoring for calculus, algebra, and engineering mathematics with concept-first teaching.',
    category: 'Tutoring',
    price: 250,
    provider: 'Riya Singh',
    rating: 4.9,
    availability: 'Weekdays after 5 PM',
    image: 'https://picsum.photos/seed/s1/400/300',
    reviews: [
      { name: 'Mukul', rating: 5, comment: 'Explains fundamentals clearly and patiently.' },
      { name: 'Anvi', rating: 5, comment: 'Helped me improve my internal marks quickly.' },
    ],
  },
  {
    id: 2,
    title: 'Poster and Resume Design',
    description:
      'Creative design support for event posters, resumes, portfolios, and club promotion assets.',
    category: 'Design',
    price: 400,
    provider: 'Sarthak Jain',
    rating: 4.7,
    availability: 'Available on weekends',
    image: 'https://picsum.photos/seed/s2/400/300',
    reviews: [
      { name: 'Lavanya', rating: 5, comment: 'Fast turnaround and very polished designs.' },
      { name: 'Parth', rating: 4, comment: 'Great communication throughout the project.' },
    ],
  },
  {
    id: 3,
    title: 'React Project Debugging Help',
    description:
      'Pair programming support for React assignments, routing issues, component cleanup, and UI polish.',
    category: 'Programming',
    price: 550,
    provider: 'Dev Malhotra',
    rating: 4.8,
    availability: 'Mon, Wed, Fri evenings',
    image: 'https://picsum.photos/seed/s3/400/300',
    reviews: [
      { name: 'Ira', rating: 5, comment: 'Fixed my state bugs in one session.' },
      { name: 'Yash', rating: 4, comment: 'Very practical help for my mini project.' },
    ],
  },
  {
    id: 4,
    title: 'LinkedIn and SOP Writing',
    description:
      'Editing support for statements of purpose, internship emails, and profile summaries with clean structure.',
    category: 'Content Writing',
    price: 300,
    provider: 'Meera Thomas',
    rating: 4.6,
    availability: 'Daily 2 PM to 8 PM',
    image: 'https://picsum.photos/seed/s4/400/300',
    reviews: [
      { name: 'Nakul', rating: 5, comment: 'My SOP became far more focused and professional.' },
      { name: 'Jiya', rating: 4, comment: 'Helpful edits and thoughtful suggestions.' },
    ],
  },
  {
    id: 5,
    title: 'UI Prototype Design Sprint',
    description:
      'Quick Figma wireframes and polished mobile-first mockups for hackathons, startups, and class projects.',
    category: 'Design',
    price: 650,
    provider: 'Aditi Kulkarni',
    rating: 4.8,
    availability: 'Slots open this Saturday',
    image: 'https://picsum.photos/seed/s5/400/300',
    reviews: [
      { name: 'Rudra', rating: 5, comment: 'The prototype gave our team a huge head start.' },
      { name: 'Sneha', rating: 5, comment: 'Sharp visuals and very collaborative process.' },
    ],
  },
  {
    id: 6,
    title: 'Python Automation Assistance',
    description:
      'Get help with scripting repetitive tasks, CSV cleanup, report generation, and beginner automation projects.',
    category: 'Programming',
    price: 480,
    provider: 'Keshav Arora',
    rating: 4.5,
    availability: 'Flexible with prior booking',
    image: 'https://picsum.photos/seed/s6/400/300',
    reviews: [
      { name: 'Tia', rating: 4, comment: 'Made my workflow much faster with a clean script.' },
      { name: 'Neil', rating: 5, comment: 'Clear explanations and great code quality.' },
    ],
  },
];

export const users = {
  id: 'user_1',
  name: 'Rahul Sharma',
  email: 'rahul@campusconnect.edu',
  role: 'both',
};

export const adminUser = {
  id: 'admin_1',
  name: 'Campus Admin',
  email: 'admin@campusconnect.edu',
  role: 'admin',
};
