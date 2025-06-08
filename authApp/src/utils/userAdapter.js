export function userAdapter(user) {
  const nameArray = user.name.split(" ");
  const firstName = nameArray[0] || "";
  const lastName = nameArray[1] || "";

  const adaptedUser = {
    ...user,
    firstName,
    lastName,
  };

  delete adaptedUser.name;
  return adaptedUser;
}