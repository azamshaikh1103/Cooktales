import { z } from "zod";

export const signInSchema = z.object({
	email: z.string().email({ message: "Invalid email format." }),
	password: z
		.string()
		.regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
			message: "Invalid password",
		}),
});

export const signUpSchema = z.object({
	name: z.string().min(1, { message: "Name is required." }),
	email: z.string().email({ message: "Invalid email format." }),
	password: z
		.string()
		.regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
			message: "Invalid password",
		}),
});
