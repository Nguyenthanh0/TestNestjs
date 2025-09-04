import bcrypt from 'bcrypt';
const saltRounds = 10;

export const hashPswHelper = async (psw: string) => {
  try {
    return await bcrypt.hash(psw, saltRounds);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const comparePswHelper = async (
  plainPasswd: string,
  hashPasswd: string,
) => {
  try {
    return await bcrypt.compare(plainPasswd, hashPasswd);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
