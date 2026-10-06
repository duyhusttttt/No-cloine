const delay = (req, res, next) => {
  const delayTime = 3000; // 3 giây
  setTimeout(() => {
    next();
  }, delayTime);
};

module.exports = delay;