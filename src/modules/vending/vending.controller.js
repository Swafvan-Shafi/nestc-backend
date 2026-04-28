const vendingService = require('./vending.service');

const getHostels = async (req, res) => {
  try {
    const hostels = await vendingService.getHostels();
    res.json(hostels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMachinesByHostel = async (req, res) => {
  try {
    const machines = await vendingService.getMachinesByHostel(req.params.id);
    res.json(machines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMachineItems = async (req, res) => {
  try {
    const items = await vendingService.getMachineItems(req.params.id);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { newStock, note } = req.body;
    const result = await vendingService.updateStock(itemId, newStock, req.user.id, note);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const subscribe = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { notifyOnRefill, notifyOnLow } = req.body;
    const result = await vendingService.subscribe(req.user.id, machineId, notifyOnRefill, notifyOnLow);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getHostels,
  getMachinesByHostel,
  getMachineItems,
  updateStock,
  subscribe
};
