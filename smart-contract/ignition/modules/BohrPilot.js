const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BohrPilot", (m) => {
  const poapDapp = m.contract("POAPDapp");
  const poapFactory = m.contract("POAPFactory");
  return { poapDapp, poapFactory };
});
