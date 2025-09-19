export const getManufactureData = (res: any) => {
  return res.data.iNav.Nodes[1].Facets.find((i: any) => i.IsSelected === true)
    .Refinements.Nodes[0].Facets;
};

export const getModelData = (res: any) => {
  return res.data.iNav.Nodes[2].Facets.find(
    (i: any) => i.IsSelected === true
  ).Refinements.Nodes[0].Facets.find((i) => i.IsSelected === true).Refinements
    .Nodes[0].Facets;
};

export const getGenerationData = (res: any) => {
  return getModelData(res).find((i) => i.IsSelected === true).Refinements
    .Nodes[0].Facets;
};
