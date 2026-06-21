import mongoose, { type Document, Schema } from "mongoose";

export interface IExercise extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    primary_muscle_id: mongoose.Types.ObjectId;
    secondary_muscle_ids: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        primary_muscle_id: {
            type: Schema.Types.ObjectId,
            ref: "MuscleGroup",
            required: true,
        },
        secondary_muscle_ids: [{
            type: Schema.Types.ObjectId,
            ref: "MuscleGroup",
            requried: false,
        }]
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret: Record<string, unknown>) {
                ret['id'] = String(ret['_id']);
                delete ret['_id']
                delete ret['__v']
                return ret;
            }
        }
    }
);

export const ExerciseModel = mongoose.model<IExercise>('Exercise', exerciseSchema)