import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function ListService() {
  const { currentUser } = useAppContext();
  const [successMessage, setSuccessMessage] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Tutoring',
    description: '',
    price: '',
    availability: '',
  });

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const addSkill = (value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue || skills.includes(trimmedValue)) {
      return;
    }

    setSkills((previous) => [...previous, trimmedValue]);
    setSkillInput('');
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill(skillInput);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSuccessMessage('Service listed successfully!');
    setFormData({
      title: '',
      category: 'Tutoring',
      description: '',
      price: '',
      availability: '',
    });
    setSkills([]);
    setSkillInput('');
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-md">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">List Service</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Showcase your student skills</h1>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-700">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-2 block text-sm font-semibold text-slate-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              >
                <option>Tutoring</option>
                <option>Design</option>
                <option>Programming</option>
                <option>Content Writing</option>
              </select>
            </div>

            <div>
              <label htmlFor="price" className="mb-2 block text-sm font-semibold text-slate-700">
                Price Per Hour
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="availability" className="mb-2 block text-sm font-semibold text-slate-700">
              Availability
            </label>
            <input
              id="availability"
              name="availability"
              type="text"
              value={formData.availability}
              onChange={handleChange}
              required
              placeholder="Weekdays after 6 PM"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="skills" className="mb-2 block text-sm font-semibold text-slate-700">
              Skills
            </label>
            <input
              id="skills"
              type="text"
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Type a skill and press Enter"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />
            {skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600"
                  >
                    {skill}
                    <button type="button" onClick={() => setSkills((previous) => previous.filter((item) => item !== skill))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            List Service
          </button>
        </form>
      </div>
    </div>
  );
}

export default ListService;
