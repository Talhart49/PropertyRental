const geocodePropertyAddress = jest.fn().mockResolvedValue({
  lat: 51.5074,
  lon: -0.1278
});

module.exports = { geocodePropertyAddress };