
const result = await page.evaluate(async () => {
  const form = document.querySelector('form[name="telechargementForm"]');
  const formData = new FormData(form);
  formData.append('btConfirmer', 'Confirmer');

  return fetch(form.action, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
    .then(
      response => {
        let readstream = response.body;

        if (response.headers['content-type'].startsWith('text/'))
          let contents = response.text();
        if (response.headers['content-type'] === 'application/json')
          let json = response.json();
      }
    );
});

// CSV data as plain text
return result;
