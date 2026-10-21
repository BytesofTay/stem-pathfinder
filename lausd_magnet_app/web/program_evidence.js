// Curated program facts, separate from the CDE campus directory.
// checkedAt is the date the linked official source was read, not an assurance
// of available seats, admission eligibility, or future course availability.
// Add records only after checking a school/LAUSD program source; see
// docs/PROGRAM_EVIDENCE.md for the evidence and conservative tagging rules.
const PROGRAM_EVIDENCE = [
  {
    schoolId: '19647330133736',
    schoolName: 'Science Academy STEM Magnet',
    programName: 'The Science Academy STEM Magnet',
    interests: ['science', 'tech', 'engineer'],
    description: 'A college-preparatory program that integrates science, technology, engineering, and mathematics across subjects. The 2026–27 profile lists computer science, programming and game design, science courses, and robotics teams.',
    descriptionEs: 'Un programa de preparación universitaria que integra las ciencias, la tecnología, la ingeniería y las matemáticas en distintas materias. El perfil de 2026–27 incluye informática, programación y diseño de videojuegos, cursos de ciencias y equipos de robótica.',
    sourceUrl: 'https://scienceacademy.lausd.org/apps/pages/TSASchoolProfile',
    checkedAt: '2026-10-21',
    eligibilityNote: 'Applicants must meet academic prerequisites through a mandatory assessment before entering the admissions lottery.',
    eligibilityNoteEs: 'Para participar en el sorteo de admisión, los solicitantes deben cumplir los requisitos académicos mediante una evaluación obligatoria.'
  },
  {
    schoolId: '19647330128710',
    schoolName: 'Dr. Sammy Lee Medical and Health Science Magnet Elementary',
    programName: 'Dr. Sammy Lee Medical and Health Science Magnet',
    interests: ['science', 'medical'],
    description: 'Students investigate human body systems, anatomy, and physiology through hands-on projects and scientific inquiry. The school describes classroom learning activities with visiting doctors from Children’s Hospital Los Angeles.',
    descriptionEs: 'Los estudiantes investigan los sistemas del cuerpo humano, la anatomía y la fisiología mediante proyectos prácticos e investigación científica. La escuela describe actividades en el aula con médicos visitantes de Children’s Hospital Los Angeles.',
    sourceUrl: 'https://leemedes.lausd.org/apps/pages/index.jsp?uREC_ID=3794958&type=d&pREC_ID=2525857',
    checkedAt: '2026-10-21'
  },
  {
    schoolId: '19647330130997',
    schoolName: 'Sylmar Biotech Health and Engineering Magnet',
    programName: 'Sylmar Biotech Health and Engineering Magnet',
    interests: ['science', 'medical', 'engineer'],
    description: 'Biotechnology, health, and engineering pathway classes accompany college-preparatory courses. The school describes project-based learning, medical and engineering labs, and tuition-free classes through Los Angeles Mission College.',
    descriptionEs: 'Las clases de las especialidades de biotecnología, salud e ingeniería complementan los cursos de preparación universitaria. La escuela describe aprendizaje basado en proyectos, laboratorios médicos y de ingeniería, y clases sin costo de matrícula a través de Los Angeles Mission College.',
    sourceUrl: 'https://sbhem.lausd.org/apps/pages/index.jsp?uREC_ID=4388281&type=d&pREC_ID=2597472',
    checkedAt: '2026-10-21'
  },
  {
    schoolId: '19647330137083',
    schoolName: 'University Pathways Medical Magnet Academy',
    programName: 'University Pathways Medical Magnet Academy (UMED)',
    interests: ['science', 'medical'],
    description: 'Medical science and patient care are woven into coursework. The school describes a patient-care lab with a 3-D anatomy table, virtual dissection, and manikins used for medical scenario simulations.',
    descriptionEs: 'Las ciencias médicas y la atención al paciente se integran en los cursos. La escuela describe un laboratorio de atención al paciente con una mesa de anatomía 3D, disección virtual y maniquíes para simular situaciones médicas.',
    sourceUrl: 'https://umedmag.lausd.org/',
    checkedAt: '2026-10-21'
  },
  {
    schoolId: '19647336058382',
    schoolName: 'Orville Wright Engineering and Design Magnet',
    programName: 'Wright Engineering and Design (STEAM) Magnet',
    interests: ['tech', 'engineer'],
    description: 'Wright’s CTE elective pathway explores engineering design, robotics, product construction, and computer programming. Families can ask the school about requesting this elective pathway.',
    descriptionEs: 'La especialidad optativa de educación técnica y profesional (CTE) de Wright explora el diseño de ingeniería, la robótica, la construcción de productos y la programación informática. Las familias pueden consultar a la escuela cómo solicitar esta especialidad optativa.',
    sourceUrl: 'https://wrightms.lausd.org/apps/pages/index.jsp?uREC_ID=4422382&type=d&pREC_ID=2657037',
    checkedAt: '2026-10-21',
    eligibilityNote: 'Wright Engineering/Design (STEAM) and Wright Gifted are separate application choices. The Gifted choice requires LAUSD gifted identification or verification by the current school.',
    eligibilityNoteEs: 'Wright Engineering/Design (STEAM) y Wright Gifted son opciones distintas en la solicitud. La opción Gifted requiere la identificación como estudiante dotado por LAUSD o la verificación de su escuela actual.',
    eligibilitySourceUrl: 'https://wrightms.lausd.org/apps/pages/index.jsp?uREC_ID=4184457&type=d&pREC_ID=2504113'
  },
  {
    schoolId: '19647331939040',
    schoolName: 'Venice Senior High',
    programName: 'Venice High School STEMM Magnet',
    interests: ['science', 'tech', 'medical', 'engineer'],
    description: 'After admission to STEMM, students choose Engineering or Biomedical Science. The engineering sequence includes programming and 3-D design; biomedical courses examine body systems, medical interventions, and health problems.',
    descriptionEs: 'Tras ingresar en STEMM, los estudiantes eligen Ingeniería o Ciencias Biomédicas. La secuencia de ingeniería incluye programación y diseño 3D; los cursos biomédicos estudian los sistemas del cuerpo humano, las intervenciones médicas y los problemas de salud.',
    sourceUrl: 'https://venicehs.lausd.org/apps/pages/STEMM',
    checkedAt: '2026-10-21'
  },
  {
    schoolId: '19647331995448',
    schoolName: 'Francisco Bravo Medical Magnet High',
    programName: 'Francisco Bravo Medical Magnet',
    interests: ['medical'],
    description: 'A medical magnet with programs offered in partnership with USC Health Sciences Campus, LA General Hospital, and Keck Hospital. The school encourages prospective families to tour and explore its program before applying.',
    descriptionEs: 'Un programa magnet médico con programas ofrecidos en colaboración con USC Health Sciences Campus, LA General Hospital y Keck Hospital. La escuela recomienda a las familias interesadas visitar la escuela y conocer su programa antes de solicitar ingreso.',
    sourceUrl: 'https://bravomedhs.lausd.org/apps/pages/index.jsp?uREC_ID=3800696&type=d&pREC_ID=2460573',
    checkedAt: '2026-10-21',
    eligibilityNote: 'The school states that it has no academic screening for enrollment; students must live within LAUSD boundaries and apply through Choices. Selection and seat availability still apply.',
    eligibilityNoteEs: 'La escuela indica que no exige una evaluación académica para ingresar; los estudiantes deben vivir dentro de los límites de LAUSD y presentar su solicitud mediante Choices. El ingreso sigue sujeto al proceso de selección y a la disponibilidad de plazas.'
  },
  {
    schoolId: '19647331936350',
    schoolName: 'North Hollywood Senior High',
    programName: 'North Hollywood Biological Sciences/Zoo Magnet',
    interests: ['science'],
    description: 'Animal studies and biological science include observation and research at zoo facilities, nearby parks, and museums. This program is located beside the Los Angeles Zoo, away from the main high-school campus; confirm the program location before planning travel.',
    descriptionEs: 'Los estudios de animales y las ciencias biológicas incluyen observación e investigación en las instalaciones del zoológico, parques cercanos y museos. Este programa está junto al Zoológico de Los Ángeles, separado del campus principal de la preparatoria; confirme su ubicación antes de planificar el traslado.',
    offCampus: true,
    locationNote: 'The Zoo Magnet meets away from the main North Hollywood High campus. Confirm the program address with the school before traveling.',
    locationNoteEs: 'El Zoo Magnet funciona fuera del campus principal de North Hollywood High. Confirme la dirección del programa con la escuela antes de trasladarse.',
    sourceUrl: 'https://northhollywoodhs.lausd.org/apps/pages/index.jsp?uREC_ID=4192124&type=d&pREC_ID=2505670',
    checkedAt: '2026-10-21'
  },
  {
    schoolId: '19647331939305',
    schoolName: 'George Washington Preparatory High',
    programName: 'Washington Preparatory STEAM Magnet',
    interests: ['science', 'tech', 'engineer', 'arts'],
    description: 'A magnet center on the Washington Preparatory campus with an introduction to science, technology, engineering, art, and mathematics. Magnet students share the larger school’s extracurricular activities and may pursue local community-college coursework.',
    descriptionEs: 'Un centro magnet en el campus de Washington Preparatory que ofrece una introducción a las ciencias, la tecnología, la ingeniería, el arte y las matemáticas. Los estudiantes del magnet participan en las actividades extracurriculares de la escuela y pueden cursar materias en un colegio comunitario local.',
    sourceUrl: 'https://washingtonprephs.lausd.org/apps/pages/index.jsp?uREC_ID=3755455&type=d&pREC_ID=2437110',
    checkedAt: '2026-10-21'
  },
  {
    schoolId: '19647336017933',
    schoolName: 'Lomita Math/Science/Technology Magnet',
    programName: 'Lomita STEAM Magnet',
    interests: ['tech'],
    description: 'The program describes hands-on project-based learning, digital citizenship, and a one-to-one student device program. Technology is the interest documented in the program information reviewed for this record.',
    descriptionEs: 'El programa describe aprendizaje práctico basado en proyectos, ciudadanía digital y un dispositivo para cada estudiante. La tecnología es el área de interés documentada en la información del programa revisada para esta ficha.',
    sourceUrl: 'https://lomitaes.lausd.org/apps/pages/index.jsp?uREC_ID=4239209&type=d&pREC_ID=2514817',
    checkedAt: '2026-10-21'
  },
  {
    schoolId: '19647330106997',
    schoolName: 'Orthopaedic Hospital',
    programName: 'Orthopaedic Hospital Medical Magnet',
    interests: ['science', 'medical'],
    description: 'Medical-themed interdisciplinary projects connect biotechnology and public health career study. The school describes community volunteering, science-related internship opportunities, and tuition-free Los Angeles Trade-Technical College courses.',
    descriptionEs: 'Los proyectos interdisciplinarios sobre temas médicos conectan el estudio de carreras en biotecnología y salud pública. La escuela describe voluntariado comunitario, oportunidades de prácticas relacionadas con las ciencias y cursos sin costo de matrícula en Los Angeles Trade-Technical College.',
    sourceUrl: 'https://sites.google.com/lausd.net/orthoprojects/about',
    checkedAt: '2026-10-21'
  }
];
