var allSettled =
  Promise.allSettled ||
  function (promises) {
    return Promise.all(
      promises.map(
        function (value) {
          return Promise.resolve(value)
            .then(this.$)
            .catch(this._)
        }, {
          $: function (value) {
            return {
              status: 'fulfilled',
              value: value
            }
          },
          _: function (reason) {
            return {
              status: 'rejected',
              reason: reason
            }
          }
        }
      )
    )
  }

module.exports = allSettled
