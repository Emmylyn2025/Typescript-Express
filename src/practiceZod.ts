import z from "zod";

const schema = z.object({
  username: z.string().trim().min(3, { message: "Username must be minimum of 3 characters" }),
  email: z.email({ message: "Invalid email format" }).trim(),
  password: z.string().trim().min(8, { message: "Password must be minimum of 8 characters" }),
  age: z.number({
    message: "Age must be a number"
  })
});

const user = {
  username: "Awobodu",
  email: "emma@gmail.com",
  password: "123456",
  age: 20
}

try {
  const result = schema.safeParse(user);
  if (!result.success) {
    console.log(result.error.flatten().fieldErrors);
  } else {
    console.log(result.data);
  }
} catch (err) {
  console.log(err);
}


//console.log(result);