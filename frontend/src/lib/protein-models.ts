export type ProteinModelRecord = {
  id: string;
  name: string;
  scientificName: string;
  entryTitle: string;
  structureUrl: string;
  previewUrl: string;
  formats: {
    structure: string;
    preview: string;
  };
  pdbEntry: {
    code: string;
    accession: string;
    doi: string;
    pdbUrl: string;
    emdbId: string;
    emdbUrl: string;
    classification: string;
    organism: string;
    expressionSystem: string;
    mutations: string;
    deposited: string;
    released: string;
    authors: string[];
    funding: string[];
  };
  experimentalDetails: Array<{
    label: string;
    value: string;
  }>;
  assemblyDetails: Array<{
    label: string;
    value: string;
  }>;
  literature: {
    title: string;
    journal: string;
    year: string;
    doi: string;
    pubmed: string;
  };
  researchHighlights: string[];
  metadata: Array<{
    label: string;
    value: string;
  }>;
};

export const DEFAULT_PROTEIN_MODEL: ProteinModelRecord = {
  id: "psi-9eys",
  name: "PSI 膜蛋白超复合物",
  scientificName: "Far-red Photosystem I membrane-protein supercomplex",
  entryTitle: "Structure of Far-Red Photosystem I from C. thermalis PCC 7203",
  structureUrl: "/models/psi_9eys.mmcif",
  previewUrl: "/models/psi_9eys_chimerax.glb",
  formats: {
    structure: "mmCIF structure",
    preview: "ChimeraX GLB preview",
  },
  pdbEntry: {
    code: "9EYS",
    accession: "pdb_00009eys",
    doi: "https://doi.org/10.2210/pdb9EYS/pdb",
    pdbUrl: "https://www.rcsb.org/structure/9EYS",
    emdbId: "EMD-50063",
    emdbUrl: "https://www.ebi.ac.uk/emdb/EMD-50063",
    classification: "PHOTOSYNTHESIS",
    organism: "Chroococcidiopsis thermalis PCC 7203",
    expressionSystem: "Chroococcidiopsis thermalis PCC 7203",
    mutations: "No",
    deposited: "2024-04-09",
    released: "2025-04-23",
    authors: ["Consoli, G.", "Tufaill, F.", "Murray, J.W.", "Fantuzzi, A.", "Rutherford, A.W."],
    funding: [
      "Biotechnology and Biological Sciences Research Council (BBSRC)",
      "Leverhulme Trust",
    ],
  },
  experimentalDetails: [
    { label: "Method", value: "Electron microscopy" },
    { label: "Resolution", value: "2.01 Å" },
    { label: "Aggregation", value: "Particle" },
    { label: "Reconstruction", value: "Single particle" },
  ],
  assemblyDetails: [
    { label: "Assembly", value: "Biological Assembly 1" },
    { label: "Global symmetry", value: "Cyclic C3" },
    { label: "Stoichiometry", value: "Hetero 36-mer, A3B3C3D3E3F3G3H3I3J3K3L3" },
    { label: "Structure weight", value: "1,111.57 kDa" },
    { label: "Atom count", value: "75,954" },
    { label: "Modeled residues", value: "6,924" },
    { label: "Unique protein chains", value: "12" },
  ],
  literature: {
    title: "Locating the missing chlorophylls f in far-red photosystem I.",
    journal: "Science 390: eado6830",
    year: "2025",
    doi: "https://doi.org/10.1126/science.ado6830",
    pubmed: "41066538",
  },
  researchHighlights: [
    "Far-red PSI from C. thermalis PCC 7203, a cyanobacterial photosystem adapted to long-wavelength light.",
    "Primary citation reports eight assigned chlorophyll f molecules, including the redox-active A-1B site.",
    "The author-assigned biological assembly is a C3 cyclic hetero 36-mer with 12 unique protein-chain types.",
  ],
  metadata: [
    { label: "PDB", value: "9EYS" },
    { label: "Method", value: "cryo-EM" },
    { label: "Assembly", value: "Biological Assembly 1" },
    { label: "Focus", value: "PSI complex + cofactors" },
  ],
};
