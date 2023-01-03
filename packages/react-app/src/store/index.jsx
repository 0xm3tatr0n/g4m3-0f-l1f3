import create from "zustand";

// global state
const useGalleryStore = create((set, get) => ({
  supply: 0,
  items: [],
  fetchSupply: async readContracts => {
    if (readContracts) {
      console.log("!fetching supply");
      const supply = await readContracts.YourCollectible.totalSupply();
      console.log("! fresh supply", supply.toString());
      set({ supply });
    }
  },
  fetchTokenUri: async readContracts => {
    if (readContracts && get().items.length !== get().supply) {
      try {
        console.log("!fetching token URIs");
        const totalSupply = get().supply;
        const chunkSize = 10;
        const quotient = Math.floor(totalSupply / chunkSize);
        // const remainder = totalSupply / chunkSize;
        const uriPromises = []; // gonna be array of arrays

        for (let c = 0; c < quotient; c++) {
          const chunkArray = [];
          for (let i = 0; i < chunkSize; i++) {
            const tokenID = c * chunkSize + i + 1;
            chunkArray.push(readContracts.YourCollectible.tokenURI(tokenID));
          }
          uriPromises.push(chunkArray);
        }

        let count = 0;
        for await (const chunk of uriPromises) {
          try {
            console.log(`gonna query chunk ${count}`);
            const results = await Promise.allSettled(chunk);
            console.log(`! got result for chunk ${count}`, results);
            count += 1;
          } catch (err) {
            console.log(`! error while querying for chunk ${count}`, err);
          }
        }

        // for (let i = 1; i <= totalSupply; i++) {
        //   uriPromises.push(readContracts.YourCollectible.tokenURI(i));
        // }

        // for await (const token of uriPromises) {
        //   const newUri = await token;
        //   console.log("! got new URI: ", newUri);
        // }
        // const allURIs = await Promise.all(uriPromises);
        // console.log("! fetched all uris: ", allURIs);

        // // parse results
        // const items = allURIs.map((u, idx) => {
        //   const jsonManifestString = atob(u.substring(29));
        //   const jsonManifest = JSON.parse(jsonManifestString);
        //   return { id: idx + 1, uri: u, ...jsonManifest };
        // });

        // console.log("! gallery update g0l", items);
        // set({ items });
      } catch (err) {
        console.log("! error fetching URIs", err);
      }
    }
  },
}));

export default useGalleryStore;
