import { Card } from "antd";
import React, { useMemo, useState } from "react";
import { useContractExistsAtAddress, useContractLoader } from "../../hooks";
import Account from "../Account";
import DisplayVariable from "./DisplayVariable";
import FunctionForm from "./FunctionForm";

const noContractDisplay = (
  <div>
    Loading...{" "}
    <div className="contract-padding">
      You need to run{" "}
      <span className="highlight">
        yarn run chain
      </span>{" "}
      and{" "}
      <span className="highlight">
        yarn run deploy
      </span>{" "}
      to see your contract here.
    </div>
    <div className="contract-padding">
      <span className="warning-emoji" role="img" aria-label="warning">
        ☢️
      </span>
      Warning: You might need to run
      <span className="highlight">
        yarn run deploy
      </span>{" "}
      <i>again</i> after the frontend comes up!
    </div>
  </div>
);

const isQueryable = fn => (fn.stateMutability === "view" || fn.stateMutability === "pure") && fn.inputs.length === 0;

export default function Contract({
  customContract,
  account,
  gasPrice,
  signer,
  provider,
  name,
  show,
  price,
  blockExplorer,
}) {
  const contracts = useContractLoader(provider);
  let contract;
  if (!customContract) {
    contract = contracts ? contracts[name] : "";
  } else {
    contract = customContract;
  }

  const address = contract ? contract.address : "";
  const contractIsDeployed = useContractExistsAtAddress(provider, address);

  const displayedContractFunctions = useMemo(
    () =>
      contract
        ? Object.values(contract.interface.functions).filter(
            fn => fn.type === "function" && !(show && show.indexOf(fn.name) < 0),
          )
        : [],
    [contract, show],
  );

  const [refreshRequired, triggerRefresh] = useState(false);
  const contractDisplay = displayedContractFunctions.map(fn => {
    if (isQueryable(fn)) {
      // If there are no inputs, just display return value
      return (
        <DisplayVariable
          key={fn.name}
          contractFunction={contract[fn.name]}
          functionInfo={fn}
          refreshRequired={refreshRequired}
          triggerRefresh={triggerRefresh}
        />
      );
    }
    // If there are inputs, display a form to allow users to provide these
    return (
      <FunctionForm
        key={"FF" + fn.name}
        contractFunction={
          fn.stateMutability === "view" || fn.stateMutability === "pure"
            ? contract[fn.name]
            : contract.connect(signer)[fn.name]
        }
        functionInfo={fn}
        provider={provider}
        gasPrice={gasPrice}
        triggerRefresh={triggerRefresh}
      />
    );
  });

  return (
    <div className="contract-container">
      <Card
        title={
          <div>
            {name}
            <div style={{ float: "right" }}>
              <Account
                address={address}
                localProvider={provider}
                injectedProvider={provider}
                mainnetProvider={provider}
                price={price}
                blockExplorer={blockExplorer}
              />
              {account}
            </div>
          </div>
        }
        size="large"
        style={{ marginTop: 25, width: "100%" }}
        loading={contractDisplay && contractDisplay.length <= 0}
      >
        {contractIsDeployed ? contractDisplay : noContractDisplay}
      </Card>
    </div>
  );
}
