if (typeof(window) !== 'undefined') {
    // code here
    const datepicker = require('js-datepicker')
    const picker = datepicker('#some-input', {
        onSelect: instance => {
            events: [
                new Date(2019, 10, 1),
                new Date(2019, 10, 10),
                new Date(2019, 10, 20),
              ]
            
          }
      
  
    
  })
}
 