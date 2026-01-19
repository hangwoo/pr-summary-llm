import { run } from './main';

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
