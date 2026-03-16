import z from "zod";

const schema = z.object({
  username: z.string().trim(),
  email: z.email().trim(),
  password: z.string().trim().min(8),
  age: z.number()
});

const user = {
  username: " Awobodu ",
  email: "emma@gmail.com",
  password: "123456789",
  age: "20"
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