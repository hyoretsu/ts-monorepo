import { useState } from "react";
import { Button } from "../../src/components/ui/Button";
import { CustomSelect } from "../../src/components/ui/CustomSelect";
import { DateField } from "../../src/components/ui/DateField";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../../src/components/ui/Dialog";
import { ScrollArea } from "../../src/components/ui/ScrollArea";
import { TextField } from "../../src/components/ui/TextField";
export function Fixture() {
	const [value, setValue] = useState("");
	const [date, setDate] = useState("");
	const [name, setName] = useState("");
	return (
		<div className="space-y-4 p-4">
			<h1>UI fixture</h1>
			<Dialog>
				<DialogTrigger asChild>
					<Button>Open parent</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Parent dialog</DialogTitle>
					</DialogHeader>
					<DialogBody>
						<TextField
							label="Example"
							name="example"
							onValueChange={setName}
							placeholder="Example record"
							required
							value={name}
						/>
						<CustomSelect
							onChange={setValue}
							options={[
								{ label: "No selection", special: true, value: "none" },
								{ label: "Alpha", value: "alpha" },
								{ label: "Beta", value: "beta" },
							]}
							searchable
							value={value}
						/>
						<DateField label="Date" name="date" onValueChange={setDate} value={date} />
						<Dialog>
							<DialogTrigger asChild>
								<Button>Open child</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Child dialog</DialogTitle>
								</DialogHeader>
								<DialogBody>
									<p>Nested content</p>
								</DialogBody>
								<DialogFooter>
									<DialogClose asChild>
										<Button variant="outline">Close child</Button>
									</DialogClose>
								</DialogFooter>
							</DialogContent>
						</Dialog>
						{Array.from({ length: 30 }, (_, i) => (
							<p key={i}>Content {i}</p>
						))}
					</DialogBody>
					<DialogFooter>
						<DialogClose asChild>
							<Button variant="outline">Close parent</Button>
						</DialogClose>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<ScrollArea className="h-60 min-h-0 rounded border" data-testid="background">
				<div className="space-y-4 p-4">
					{Array.from({ length: 80 }, (_, i) => (
						<p key={i}>Background {i}</p>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
