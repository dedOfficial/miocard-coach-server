import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { DeleteDoctorDto } from './dto/delete-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { Doctor, DoctorDocument } from './models/doctor.model';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(Doctor.name)
    private readonly doctorModel: Model<DoctorDocument>,
  ) {}

  addDoctor(createDoctorDto: CreateDoctorDto) {
    const createdDoctor = new this.doctorModel({
      name: createDoctorDto.name,
      number: createDoctorDto.number,
      email: createDoctorDto.email,
    });

    return createdDoctor.save();
  }

  async addAvatar(id: string) {
    return await this.doctorModel.findByIdAndUpdate(
      id,
      { avatar: `${id}.webp` },
      { new: true, useFindAndModify: false },
    );
  }

  async updateDoctor(body: UpdateDoctorDto) {
    return await this.doctorModel.findByIdAndUpdate(
      body.id,
      {
        number: body.number,
        name: body.name,
        email: body.email,
      },
      {
        new: true,
        useFindAndModify: false,
      },
    );
  }

  removeDoctor(deleteDoctorDto: DeleteDoctorDto) {
    return this.doctorModel.findByIdAndDelete(deleteDoctorDto.id).exec();
  }

  listDoctors() {
    return this.doctorModel.find({}).exec();
  }

  getDoctor(id: string) {
    return this.doctorModel.findById(id).exec();
  }

  async findDoctorByEmail(email: string) {
    return this.doctorModel.findOne({ email }).exec();
  }
}
