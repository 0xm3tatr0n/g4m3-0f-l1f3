import create from "zustand";

// global state
const useGalleryStore = create((set, get) => ({
  supply: 0,
  items: [],
  fetchSupply: async readContracts => {
    if (readContracts) {
      console.log("!fetching supply");
      const supply = await readContracts.YourCollectible.totalSupply();
      console.log(">>> fresh supply", supply.toString());
      set({ supply });
    }
  },
  fetchTokenUri: async readContracts => {
    if (readContracts && get().items.length != get().supply) {
      console.log("!fetching token URIs");
      const uriPromises = [];
      for (let i = 1; i <= get().supply; i++) {
        uriPromises.push(readContracts.YourCollectible.tokenURI(i));
      }
      const allURIs = await Promise.all(uriPromises);

      const items = allURIs.map((u, idx) => {
        const jsonManifestString = atob(u.substring(29));
        const jsonManifest = JSON.parse(jsonManifestString);
        return { id: idx + 1, uri: u, ...jsonManifest };
      });

      console.log(">>> gallery update g0l", items);
      set({ items });
    }
  },
}));

export default useGalleryStore;
